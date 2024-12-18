import Multer from 'multer'

const storage = Multer.memoryStorage()
const multer = Multer({ storage })

export default multer