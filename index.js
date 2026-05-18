const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT
app.get('/', (req, res) => {
    res.send('This is mediQueue server')
})

app.listen(port, () => {
    console.log(`The server is running on port ${port}`)
})
