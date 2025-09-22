const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function simpleCheck() {
  try {
    console.log('Checking database connection...')
    
    const userCount = await prisma.user.count()
    console.log(`Total users: ${userCount}`)
    
    const studentCount = await prisma.user.count({ where: { role: 'student' } })
    console.log(`Students: ${studentCount}`)
    
    const courseCount = await prisma.course.count()
    console.log(`Courses: ${courseCount}`)
    
    const notificationCount = await prisma.notification.count()
    console.log(`Notifications: ${notificationCount}`)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

simpleCheck()
