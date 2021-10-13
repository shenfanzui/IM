const httpServer = require('http').createServer(handler)
const io = require('socket.io')(httpServer)
const fs = require('fs')
const { rootCertificates } = require('tls')
const { instrument } = require('@socket.io/admin-ui')

function handler(req, res){
    if(req.url == '/'){
        fs.readFile('./index.html', (err, data) =>{
            if(err){
                res.writeHead('404')
                res.end('404 not found')
            }else{
                res.writeHead('200')
                res.end(data)
            }
        })
    }else{
        fs.readFile(`./${req.url}`, (err, data) =>{
            if(err){
                res.writeHead('404')
                res.end('404 not found')
            }else{
                res.writeHead('200')
                res.end(data)
            }
        })
    }
}

var names = []

// 中间件验证客户端身份 （无cookie时抛出异常）
// io.use((socket, next) => {
//     if(socket.request.headers.cookie) return next();
//     next(new Error('Authentication error'));
// })

// 获取参数
// io.use(socket => {
//     var query = socket.request._query;
//     var sid = query.sid;
//     console.log(`参数sid: ${sid}`);
// })

// 凭证
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(token)
    next()
})

// error 触发客户端connect_error
// io.use((socket, next) => {
//     const err = new Error('not authorized');
//     err.data = { content: 'please retry later'}
//     next(err)
// })

io.on('connection', socket => {
    // 连接的客户端数量
    const count = io.engine.clientsCount;
    console.log(`连接的客户端的数量： ${count}`)

    console.log(`id : ${socket.id}`)
    socket.emit('login', names)
    socket.on('login', data => {
        console.log(`login name : ${data.name}`)
        names.push(data.name)
        io.emit('login', names)
    })
    socket.on('disconnect', function(reason){
        console.log(`disconnect: ${reason}`)
        names = []
    })

    setInterval(() => {
        socket.emit('ping', {data: Date().toString(), msg: '服务端消息'})
    }, 5000);

    socket.on('pong', (data) =>{
        console.log(data.data)
        console.log(data.msg)
    })

    // send message
    setInterval(() => {
        socket.send('客户端你好啊')
    }, 5000);
    socket.on('message', data => {
        console.log(data)
    })

    // 消息确认
    socket.on('confirm', (data, fn) => {
        console.log(`消息确认：${data}`)
        fn(`服务端已接收到-${data}-消息`)
    })
    
    // onlyone 
    setInterval(() => {
        io.to(socket.id).emit('only', 'onlyone')
    }, 5000);
     
    socket.on("private message", (anotherSocketId, msg) => {
        socket.to(anotherSocketId).emit("private message", socket.id, msg);
    });
})

// namespace
io.of('chat').on('connection', function(socket){
    console.log('room连接')
    console.log(socket.id)
    socket.emit('room', '123456')
    socket.on('room', data => {
        console.log(data)
    })
})
instrument(io, {
    auth: false
})

httpServer.listen('3001')
