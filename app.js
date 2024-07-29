const express = require('express')
const app = express()
const port = 5000
const {executeCode} = require('./helpers/executeCode');

app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/execute', async(req, res) => {

  let { language, code, problemId } = req.body;

  const answer = await executeCode({ language, code, problemId, submissionId: 34});

  res.send({
    answer
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
