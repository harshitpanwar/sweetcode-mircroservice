const executeCode = async (inputs) => {

    try {
      
      const input = codeExecutionSchema.parse(inputs);
      const { language, code, problemId} = input;

      // fetch problem from database using problemId

      const createOptions = {
          Image: 'node-executer',
          HostConfig: {
              PortBindings: {
                  '3000/tcp': [{ HostPort: '3000' }]
              }
          }

      }
      const container = await docker.createContainer(createOptions);
      await container.start();

      //find the running status of the container
      const containerInfo = await container.inspect();
      
      //after 10 seconds check the running status of this container, if the container is still running then throw an error
      setTimeout(()=>{

          if(containerInfo.State.Running){
              container.stop();
              container.remove();
              throw new Error('Container is taking too long to execute the code');
          }

      }, SET_TIMEOUT_FOR_CONTAINER_RESTART);


      //wait for few seconds for the container to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const apiResponse = await fetch('http://localhost:3000/execute', {
          method: 'POST',
          body: JSON.stringify({
            code: code,
          }),
          headers: { 'Content-Type': 'application/json' }
      });
      const result = await apiResponse.json();
      await container.stop();

      //delete the container
      await container.remove();

      return result;
  
    } catch (error) {
      return error;
    }

}