const server = require('http').createServer(handler)
const io = require('socket.io')(server)
const fs = require('fs')

function handler(req, res){
    fs.readFile('./client.html', (err, data) =>{
        if(err){
            res.writeHead('404')
            res.end('404 not Found!')
        }else{
            res.writeHead('200')
            res.end(data)
        }
    })
}
io.on('connection', socket =>{
    // socket.id
    console.log(socket.id)
    // 收消息
    socket.on('client message', data => {
        console.log(data.msg);
    })
    // 发消息
    socket.emit('server message', {msg: 'hi, clients'})
    // 断开链接
    socket.on('disconnect', (reason)=>{
        console.log('disconnect:' + reason)
    })
})

server.listen(3000)


