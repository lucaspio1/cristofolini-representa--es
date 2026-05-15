import { Router } from 'express';
import { getSales, createSale, updateSale, deleteSale, getSaleInstallments } from '../controllers/salesController';

const router = Router();

router.get('/', getSales);
router.post('/', createSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

// Rota para buscar as parcelas de uma venda específica
router.get('/:id/installments', getSaleInstallments);

export default router;