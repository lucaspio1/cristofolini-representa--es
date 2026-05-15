import { Router } from 'express';
import { getProductLines, createProductLine, updateProductLine, deleteProductLine } from '../controllers/productLineController';

const router = Router();

router.get('/', getProductLines);
router.post('/', createProductLine);
router.put('/:id', updateProductLine);
router.delete('/:id', deleteProductLine);

export default router;