"use client";

import AppHeader from '@/components/common/AppHeader';
import { LoadingSpinner } from '@/components/common/ui';
import QrScanner from '@/components/qr/QrScanner';
import GameList from '@/components/trades/GameList';
import { useEventPhase } from "@/contexts/EventPhaseContext";
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import type { DeliverTrade, Trade, TradeResponse, User } from "@/types";
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowCircleRight, X } from 'phosphor-react';
import { Suspense, useCallback, useEffect, useState } from 'react';

export default function DeliverToUserPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner message="Cargando página..." /></div>}>
      <DeliverToUserPageContent />
    </Suspense>
  );
}

function DeliverToUserPageContent() {
  const { isAuthenticated, userId, isLoading: authIsLoading } = useAuth();
  const [qrData, setQrData] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Trade[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialQrProcessed, setInitialQrProcessed] = useState(false);
  const { eventPhase, isLoadingEventPhase, eventPhaseDisplay } = useEventPhase();
  const { execute: updateUserStatus } = useApi<any>('logistics/users/update-status/', { method: 'PATCH' });
  const { execute: fetchUserGames } = useApi<TradeResponse<DeliverTrade>>('logistics/user/', { method: 'GET' });
  const { execute: bulkUpdateStatus } = useApi<any>('logistics/games/bulk-update-status/', { method: 'PATCH' });
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [userComment, setUserComment] = useState<string>('');

  const handleScan = useCallback(async (data: string) => {
    if (data && !isLoading) {
      setIsLoading(true);
      setError('');
      setQrData(data);
      setGames(null);
      try {
        const tradesData = await fetchUserGames(undefined, `${data}/games/deliver/`);
        
        if (!tradesData) {
          throw new Error('No se pudieron obtener los datos del usuario.');
        }
        
        const gamesData = tradesData.games
        const userData = tradesData.user
        setGames(gamesData);
        setUser(userData);

        if (gamesData && gamesData.length > 0) {
          try {
            await updateUserStatus({
              user_id: userData.id,
              status: 'receiving'
            });
          } catch (statusErr) {
            console.error('Error al actualizar status del usuario:', statusErr);
          }
        }

        if (tradesData.user && tradesData.user.comment_on_user) {
          setUserComment(tradesData.user.comment_on_user);
          setShowCommentModal(true);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Ups, algo falló al obtener los juegos a retirar.');
        }
        setTimeout(() => {
          setQrData(null);
          setGames(null);
          setError('');
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLoading, updateUserStatus, fetchUserGames]);

  useEffect(() => {
    if (initialQrProcessed || isLoading || games) return;

    const qrFromUrl = searchParams.get('qr');
    if (qrFromUrl) {
      handleScan(qrFromUrl);
      setInitialQrProcessed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading, games, initialQrProcessed, handleScan]);

  const handleDeliverySuccess = useCallback((deliveredTradeCodes: number[]) => {
    setGames(prevGames => {
      if (!prevGames) return null;
      return prevGames.map(game =>
        deliveredTradeCodes.includes(game.result.assigned_trade_code)
          ? { ...game, result: { ...game.result, status_display: "Delivered" } }
          : game
      );
    });
  }, []);

  const handleUpdateItems = useCallback(async (itemIds: number[], deliveredByUserId: number) => {
    if (!qrData || !games || !deliveredByUserId || games.length === 0) {
      setError('Faltan datos para la actualización.');
      return;
    }

    const itemsToUpdate = games.filter(game => itemIds.includes(game.result.assigned_trade_code));
    const idsToUpdate = itemsToUpdate.map(game => game.result.assigned_trade_code);
    if (idsToUpdate.length === 0) return;

    try {
      await bulkUpdateStatus({
        status: 6,
        assigned_trade_codes: itemIds,
        change_by_id: deliveredByUserId
      });

      const allItemsDelivered = itemsToUpdate.every(trade => trade.result.status_display === 'Delivered');

      if (allItemsDelivered && itemsToUpdate.length > 0) {
        updateUserStatus({
          user_id: user?.id,
          status: 'completed'
        }).catch(err => {
          console.error('Failed to update user status to completed:', err);
        });
      }

      handleDeliverySuccess(itemIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falló la actualización.');
    }
  }, [qrData, games, handleDeliverySuccess, updateUserStatus, user?.id, bulkUpdateStatus]);

  if (authIsLoading || isAuthenticated === null || isLoadingEventPhase) {
    return <div className="flex justify-center items-center min-h-screen nm-surface"><LoadingSpinner message="Validando sesión..." /></div>;
  }


  const isDeliveringEnabled = eventPhase === 2;

  return (
    <main className="flex flex-col items-center min-h-dvh text-gray-900">
      {isAuthenticated && (
        <AppHeader
          pageTitle="Entrega"
          pageIcon={ArrowCircleRight as any}
          showBackButton={true}
        />
      )}
      <div className="w-full max-w-3xl mx-auto text-center px-4">
      </div>

      <section className="w-full max-w-xl p-4 sm:p-6 rounded-xl shadow-xl">
        {isLoading && <LoadingSpinner message="Buscando información..." />}
        {error && <p className="text-base sm:text-lg text-red-600 my-4 p-4 bg-red-50 border border-red-300 rounded-lg text-center">{error}</p>}

        {!isLoading && !error && isAuthenticated && (
          <>
            {!qrData ? (
              <QrScanner
                onScan={handleScan}
                disabled={!isDeliveringEnabled}
                disabledMessage="La entrega de juegos está deshabilitada en la fase actual del evento."
              />
            ) : games && games.length > 0 && (
              <GameList
                trades={games}
                user={user}
                onFinish={() => { setQrData(null); setGames(null); setError(''); }}
                deliveredByUserId={userId ? parseInt(userId, 10) : null}
                onUpdateItems={handleUpdateItems}
                mode="deliver"
              />
            )}
          </>
        )}
      </section>

      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="nm-surface rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                Advertencia
              </h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {userComment}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 nm-btn-primary"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
