const {codeExecutionSchema} = require('../schemas/codeExecutionSchema');
const Docker = require('dockerode');
const docker = new Docker();
const fs = require('fs');
const path = require('path');
const Stream = require('stream');
const {Submission} = require('../models/Submission');
const {s3Upload} = require('./s3upload');

const S3_SUBMISSIONS_FOLDER = 'sweetcode/submissions';
const S3_RESULTS_FOLDER = 'sweetcode/results';

const dockerMap = {
  'javascript': 'node-executer'
}
const extensionMap = {
  'javascript': 'js',
  'python': 'py',
  'java': 'java'
}

const formatValue = value => {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  } else {
    return value.toString();
  }
};

const executeCodeInDocker = async (language, code) => {

  let container;

  const containers = await docker.listContainers({
    filters: {
      ancestor: [dockerMap[language]],
      status: ['running']
    }
  });

  if(containers.length > 0){

    // randomly select a container
    const randomIndex = Math.floor(Math.random() * containers.length);
    const containerId = containers[randomIndex].Id;
    container = docker.getContainer(containerId);

  }
  else{
      //create a new container
      const createOptions = {
          Image: dockerMap[language],
          HostConfig: {
              PortBindings: {
                  '4000/tcp': [{ HostPort: '4000' }]
              }
          }
      }
      container = await docker.createContainer(createOptions);
      await container.start();
      // wait for few seconds for the container to start
      await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const exec = await container.exec({
    Cmd: ['sh', '-c', `echo '${code}' > /usr/src/app/code.${extensionMap[language]}`]
  });
  await exec.start();

  const execRun = await container.exec({
    AttachStdout: true,
    AttachStderr: true,
    Cmd: ['sh', '-c', `node /usr/src/app/code.${extensionMap[language]}`]
  });
  const stream = await execRun.start({ hijack: true});

  const demuxStream = async (stream) => {
    let result = '';
    const stdout = new Stream.PassThrough();
    const stderr = new Stream.PassThrough();

    docker.modem.demuxStream(stream, stdout, stderr);

    stdout.on('data', (data) => {
      result += data.toString();
    });

    stderr.on('data', (data) => {
      result += data.toString();
    });

    await new Promise((resolve) => {
      stream.on('end', resolve);
    });

    return result.trim();
  };

  const answer = await demuxStream(stream);
  return answer;

}

const executeCode = async (inputs) => {

    try {
      
      const { language, code, problemId, submissionId} = codeExecutionSchema.parse(inputs);

      // upload the request to S3 bucket
      let options = {
        folder: `${S3_SUBMISSIONS_FOLDER}/${problemId}`,
        file: {
          name: `${submissionId}.json`,
          data: JSON.stringify(inputs)
        }
      };

      try {

        await s3Upload(options);

      } catch (error) {
        
        console.log('Error uploading to S3', error);

      }

      const boilerPlatePath = path.join(__dirname, `../problems/${problemId}/boilerplates/${language}.txt`);

      if(!fs.existsSync(boilerPlatePath)){
          throw new Error('Boilerplate file does not exist');
      }

      const boilerPlate = fs.readFileSync(boilerPlatePath, 'utf-8');
      const codeToExecute = boilerPlate.replace('#USER_CODE', code);

      const inputOutputJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../problems/${problemId}/input_output.json`), 'utf8'));
      let results = [];
      let finalOutput = true;
      for( let item of inputOutputJson){

        // make a copy of the code to execute
        let currentCode = codeToExecute;
        const inputObject = item.input;
        const input = Object.values(inputObject).map(formatValue).join(', ');;
        currentCode = currentCode.replace('#INPUT', input);

        const expectedOutput = item.output;

        let output, outputObject;
        try {
          output = await executeCodeInDocker(language, currentCode);
        } catch (error) {
            output = error.message;
        }
        let result;

        if(typeof output === 'string') {
            result = output === expectedOutput;
            outputObject = output;
        }
        else{
          result = JSON.stringify(JSON.parse(output)) === JSON.stringify(expectedOutput);
          outputObject = JSON.parse(output);
        }     


        if(!result){
            finalOutput = false;
        }

        results.push({
            input: inputObject,
            output: outputObject,
            expectedOutput: expectedOutput,
            result: result
        });
    
    } 

    options = {
      folder: `${S3_RESULTS_FOLDER}/${problemId}`,
      file: {
        name: `${submissionId}.json`,
        data: JSON.stringify(results)
      }
    };

    try {
      await s3Upload(options);
    } catch (error) {
      console.log('Error uploading to S3', error);
    }
      const submission = await Submission.findByPk(submissionId);
      submission.status = finalOutput ? 'SUCCESS' : 'FAILED';
      submission.code = JSON.stringify({
        input_s3_path: `${S3_SUBMISSIONS_FOLDER}/${problemId}/${submissionId}.json`,
        output_s3_path: `${S3_RESULTS_FOLDER}/${problemId}/${submissionId}.json`
      });
      await submission.save();

      return results;

    } catch (error) {
      return error.message;
    }

}

exports.executeCode = executeCode;