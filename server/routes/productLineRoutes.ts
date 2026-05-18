import { Router } from 'express';
import { getProductLines, createProductLine, updateProductLine, deleteProductLine } from '../controllers/productLineController';
import { upload } from '../../server';

const router = Router();

router.get('/', getProductLines);
router.post('/', createProductLine);
router.put('/:id', updateProductLine);
router.delete('/:id', deleteProductLine);
router.post('/', upload.single('image'), createProductLine);

export default router;