import { Router } from 'express';
import { getProductLines, createProductLine, updateProductLine, deleteProductLine } from '../controllers/productLineController';
import { upload } from '../middlewares/upload';

const router = Router();

router.get('/', getProductLines);
// Usando o multer ('upload.single') para interceptar a imagem na criação e edição
router.post('/', upload.single('image'), createProductLine);
router.put('/:id', upload.single('image'), updateProductLine);
router.delete('/:id', deleteProductLine);

export default router;