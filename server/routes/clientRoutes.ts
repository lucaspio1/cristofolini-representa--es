import { Router } from 'express';
import {
  getClients, createClient, updateClient, deleteClient,
  getClientProducts, createClientProduct, updateClientProduct, deleteClientProduct
} from '../controllers/clientController';

const router = Router();

// Rotas de Clientes (/api/clients)
router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Rotas de Produtos vinculados ao Cliente (/api/clients/:id/products)
router.get('/:id/products', getClientProducts);
router.post('/:id/products', createClientProduct);

// Rotas diretas do Produto (/api/client-products/:id) - Mantendo a URL original do frontend
router.put('/client-products/:id', updateClientProduct);
router.delete('/client-products/:id', deleteClientProduct);

export default router;