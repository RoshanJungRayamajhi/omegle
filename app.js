const express = require("express")
const app = express()
const SocketIo = require("socket.io")
const http = require("http")
const Server = http.createServer(app)
const io = SocketIo(Server)
const path = require("path")

const indexRoutes = require("./Routes/indexRoutes")

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "Public")))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


let waitingUsers = []
let rooms = {}

io.on("connection", (socket) => {
     socket.on("joinroom", () => {
        if (waitingUsers.length > 0) {
            let partner = waitingUsers.shift();
            const roomsname = `${socket.id}-${partner.id}`
            socket.join(roomsname)
            partner.join(roomsname)
            io.to(roomsname).emit("joined", roomsname)
        } else {
            waitingUsers.push(socket)
        }
    })

    socket.on("signalingMessage",(data)=>{
     socket.broadcast.to(data.room).emit("signalingMessage",data.message)
    })

    socket.on("message", (data) => {
        socket.broadcast.to(data.room).emit("message", data.message)
    })

    socket.on("startvideocall",(data)=>{
      socket.broadcast.to(data.room).emit("incommingcall")
    })
    socket.on("acceptCall",({room})=>{
        socket.broadcast.to(room).emit("callaccepted")
    })
    socket.on("rejectcall",({room})=>{
        socket.broadcast.to(room).emit("callrejected")
    })

    socket.on("disconnect", function () {
        let index = waitingUsers.findIndex(waitingUser => waitingUser.id === socket.id)
        waitingUsers.splice(index, 1)
    })
})
app.use("/", indexRoutes)

Server.listen(process.env.PORT || 3000)