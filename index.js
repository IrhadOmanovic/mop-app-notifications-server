import { Server } from 'socket.io'

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

let onlineUsers = []

const addNewUser = ({userId, socketId, email}) => {
  if (!onlineUsers.some((user) => user.userId === userId)){
    onlineUsers.push({userId, socketId, email})
  }
}

const deleteUser = ({socketId}) => {
  onlineUsers = onlineUsers.filter(user => user.socketId !== socketId)
}

const getUser = ({userId}) => {
  return onlineUsers.find(user => user.userId === userId)
}

io.on('connection', (socket) => {
  socket.on("newUser", ({userId, email}) => {
    addNewUser({
      socketId: socket.id,
      userId: userId,
      email: email
    })
  })

  socket.on("sendNotification", ({senderId, recieverId, type, questionId, email}) => {
    const reciever = getUser({
      userId: recieverId
    })

    const sender = getUser({
      userId: senderId
    })
    io.to(reciever.socketId).emit("getNotifications", {
      senderId,
      type,
      senderEmail: sender.email,
      questionId: questionId,
      email: email
    })
  })

  // console.log('Someone has connected')
  socket.on('disconnect', () => {
    deleteUser({
      socketId: socket.id
    })
  })
})

io.listen(process.env.PORT || 80)
