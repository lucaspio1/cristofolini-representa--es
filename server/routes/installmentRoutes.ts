import { Router } from 'express';
import { getAllInstallments, updateInstallment } from '../controllers/installmentController';

const router = Router();

router.get('/', getAllInstallments);
router.put('/:id', updateInstallment);

export default router;