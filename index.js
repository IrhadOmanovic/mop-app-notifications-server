import { Server } from 'socket.io'

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

let onlineUsers = []
let userNotifications = []

const addNewUser = ({userId, socketId, email}) => {
  if (!onlineUsers.some((user) => user.userId === userId)){
    onlineUsers.push({userId, socketId, email, notifications : []})
  }
}

const getUserNotifications = (userId) => {
  return userNotifications.find(item => item.userId === userId)?.notifications || []
}

const addNewNotificationToUser = (userId, notification) => {
  const index = userNotifications.findIndex(user => user.userId === userId)
  if (index === -1) {
    userNotifications.push({userId : userId, notifications: [notification]})
  } else {
    userNotifications[index].notifications.push(notification)
  }
}

const deleteNotification = ({userId, indexNotification}) => {
  const index = userNotifications.findIndex(user => user.userId === userId)

  userNotifications[index].notifications.splice(indexNotification, 1)
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

    io.to(socket.id).emit("getNotifications", getUserNotifications(userId))
  })

  socket.on("deleteNotification", ({userId, indexNotification}) => {
    deleteNotification({userId, indexNotification})
  })

  socket.on("sendNotification", ({senderId, recieverId, type, questionId, email}) => {
    const reciever = getUser({
      userId: recieverId
    })

    const sender = getUser({
      userId: senderId
    })

    const notification = {
      senderId,
      type,
      senderEmail: sender.email,
      questionId: questionId,
      email: email
    }

    addNewNotificationToUser(recieverId, notification)

    io.to(reciever.socketId).emit("getNotifications", getUserNotifications(recieverId))
  })

  // console.log('Someone has connected')
  socket.on('disconnect', () => {
    deleteUser({
      socketId: socket.id
    })
  })
})

io.listen(process.env.PORT || 80)
