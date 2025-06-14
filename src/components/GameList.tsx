"use client";

import type { Game, Item, Trade, User } from "@/types";
import { Check } from 'lucide-react';
import { useState, useEffect } from 'react'; 
import ConfirmationModal from './ConfirmationModal'; 

interface GameListProps {
  trades: Trade[];
  onUpdateItems: (itemIds: number[], deliveredByUserId: number) => Promise<void>;
  onFinish: () => void;
  deliveredByUserId: number | null;
}

const GameList: React.FC<GameListProps> = ({ trades, onUpdateItems, onFinish, deliveredByUserId }) => {
  const pendingItems = trades.filter(trade => trade.result.status_display != "Delivered");
  const deliveredItemsCount = trades.length - pendingItems.length;

  const [selectedItems, setSelectedItems] = useState<Set<number>>(() => {
    const initialSelected = new Set<number>();
    if (trades) {
      trades.forEach(trade => {
        if (trade.result.status_display != "Delivered") {
          initialSelected.add(trade.math_item_exchanged.id);
        }
      });
    }
    return initialSelected;
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToConfirm, setItemsToConfirm] = useState<Trade[]>([]);
  const [confirmActionType, setConfirmActionType] = useState<'all' | 'selected' | null>(null);

  useEffect(() => {
    const initialSelected = new Set<number>();
    pendingItems.forEach(trade => initialSelected.add(trade.math_item_exchanged.id));
    setSelectedItems(initialSelected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]); 


  const handleToggleSelectedItem = (itemId: number) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      return newSelected;
    });
  };

  const handleDeliverAllPending = async () => {
    const itemsToConfirmDelivery = trades.filter(trade => trade.result.status_display != "Delivered");
    if (itemsToConfirmDelivery.length > 0) {
      setItemsToConfirm(itemsToConfirmDelivery);
      setConfirmActionType('all');
      setIsConfirmModalOpen(true);
    }
  };

  const handleDeliverSelected = async () => {
    const itemsToConfirmDelivery = trades.filter(trade => selectedItems.has(trade.math_item_exchanged.id) && trade.result.status_display != "Delivered");
    if (itemsToConfirmDelivery.length > 0) {
      setItemsToConfirm(itemsToConfirmDelivery);
      setConfirmActionType('selected');
      setIsConfirmModalOpen(true);
    }
  };

  const executeConfirmedDelivery = async () => {
    const itemIdsToDeliver = itemsToConfirm.map(trade => trade.math_item_exchanged.id);
    if (itemIdsToDeliver.length > 0 && deliveredByUserId !== null) {
      await onUpdateItems(itemIdsToDeliver, deliveredByUserId);
      setSelectedItems(new Set());
      if (confirmActionType === 'all') {
        setTimeout(() => {
          const finishButton = document.getElementById('finish-button');
          finishButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-secondary-blue dark:text-sky-400">
          {trades[0].from_member.first_name} {trades[0].from_member.last_name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID User: {trades[0].from_member.id}</p>
      </div>

      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Resumen: {pendingItems.length} {pendingItems.length === 1 ? 'juego pendiente' : 'juegos pendientes'} de {trades.length} en total:
        </p>
        {pendingItems.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {pendingItems.map((trade) => (
              <li key={`summary-${trade.math_item_exchanged.id}`} 
                  className="flex items-center p-2 bg-white dark:bg-gray-700/60 rounded-md shadow-sm"
              >
                <span className="font-bold text-secondary-blue dark:text-sky-400 w-10 text-center shrink-0 text-lg mr-3">{trade.math_item_exchanged.id}</span>
                <span className="truncate min-w-0">{trade.math_item_exchanged.title}</span> 
              </li>
            ))}
          </ul>
        )}
        {deliveredItemsCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            ({deliveredItemsCount} ya {deliveredItemsCount === 1 ? 'entregado' : 'entregados'})
          </p>
        )}
      </div>

      {pendingItems.length > 0 && (
        <button
          onClick={handleDeliverAllPending}
          className="w-full mb-6 px-6 py-3 bg-accent-yellow text-gray-800 font-semibold rounded-lg shadow-md hover:opacity-85 transition-opacity duration-150 ease-in-out"
        >
          Entregar TODO lo pendiente ({pendingItems.length})
        </button>
      )}

      {trades.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 my-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">Este usuario no tiene juegos para entregar.</p>
      )}
      <ul className="space-y-3">
        {trades
          .slice() 
          .sort((a, b) => ((a.result.status_display == "Delivered") === (b.result.status_display == "Delivered") ? 0 : (a.result.status_display == "Delivered") ? 1 : -1)) 
          .map((trade: Trade) => (
          <li
            key={trade.math_item_exchanged.id}
            className={`flex rounded-xl shadow-md transition-all duration-200 overflow-hidden
                            ${trade.result.status_display == "Delivered"
                ? 'bg-accent-green/30 dark:bg-accent-green/20 opacity-70' 
                : `bg-gray-50 dark:bg-gray-700/50 hover:shadow-lg ${selectedItems.has(trade.math_item_exchanged.id) ? 'ring-2 ring-secondary-blue ring-offset-1 dark:ring-offset-gray-800' : ''}`}`}
            onClick={trade.result.status_display != "Delivered" ? () => handleToggleSelectedItem(trade.math_item_exchanged.id) : undefined}
          >
            <div className={`flex-shrink-0 w-16 sm:w-20 flex items-center justify-center p-3 sm:p-4
                            ${trade.result.status_display == "Delivered" ? 'bg-secondary-blue/50' : 'bg-secondary-blue'} 
                            ${trade.result.status_display == "Delivered" ? 'cursor-default' : 'cursor-pointer'}`}>
              <span className={`text-2xl sm:text-3xl font-bold ${trade.result.status_display == "Delivered" ? 'text-white/70' : 'text-white'}`}>
                {trade.math_item_exchanged.id}
              </span>
            </div>
            <div className={`flex-grow p-3 sm:p-4 ${trade.result.status_display == "Delivered" ? 'cursor-default' : 'cursor-pointer'}`}>
              <label htmlFor={trade.result.status_display != "Delivered" ? `checkbox-item-${trade.math_item_exchanged.id}` : undefined} className={`${trade.result.status_display != "Delivered" ? 'cursor-pointer' : 'cursor-default'}`}>
                <span className={`text-base sm:text-lg font-semibold leading-tight ${trade.result.status_display == "Delivered" ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-secondary-blue dark:text-sky-400'}`}>
                   {trade.math_item_exchanged.title}
                </span>
              </label>
            </div>

            <div className="flex-shrink-0 w-16 sm:w-20 flex items-center justify-center p-3 sm:p-4">
              {trade.result.status_display == "Delivered" ? (
                <div className="w-8 h-8 sm:w-15 sm:h-10 rounded-full flex items-center justify-center border-2 bg-accent-green border-accent-green">
                  <Check size={18} className="text-black" />
                </div>
              ) : (
                <>
                <input
                  type="checkbox"
                  id={`checkbox-item-${trade.math_item_exchanged.id}`}
                  className="sr-only peer" 
                  checked={selectedItems.has(trade.math_item_exchanged.id)}
                  onChange={() => handleToggleSelectedItem(trade.math_item_exchanged.id)}
                />
                <label
                  htmlFor={`checkbox-item-${trade.math_item_exchanged.id}`} 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 cursor-pointer
                              transition-colors duration-150 ease-in-out
                              peer-focus:ring-2 peer-focus:ring-offset-1 dark:peer-focus:ring-offset-gray-800
                              ${selectedItems.has(trade.math_item_exchanged.id)
                      ? 'bg-secondary-blue border-secondary-blue peer-focus:ring-secondary-blue'
                      : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 peer-focus:ring-gray-400'}`}
                >
                  {selectedItems.has(trade.math_item_exchanged.id) && <Check size={18} className="text-white" />}
                </label>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {pendingItems.length > 0 && selectedItems.size > 0 && (
        <button
          onClick={handleDeliverSelected}
          className="w-full mt-8 px-6 py-3 bg-secondary-blue hover:opacity-85 text-white text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out"
        >
          Entregar lo marcado ({selectedItems.size})
        </button>
      )}

      <button
        onClick={onFinish}
        id="finish-button" 
        className="w-full mt-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out"
      >
        {pendingItems.length === 0 && trades.length > 0 ? 'Todo entregado. Siguiente QR' : 'Listo, otro QR'}
      </button>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeConfirmedDelivery}
        itemsToDeliver={itemsToConfirm}
        actionType={confirmActionType || 'selected'} 
      />
    </div>
  );
};

export default GameList;