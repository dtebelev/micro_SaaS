// Кнопка PayPal Subscribe. Грузит PayPal JS SDK один раз (client-id — публичный,
// как VITE_SUPABASE_ANON_KEY), рендерит родную кнопку PayPal, после одобрения
// подтверждает подписку на сервере (server проверяет статус у самого PayPal).
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { confirmPaypalSubscription } from '@/lib/api'

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
const PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID

let sdkPromise = null
function loadPayPalSdk() {
  if (window.paypal) return Promise.resolve(window.paypal)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&vault=true&intent=subscription`
    script.onload = () => resolve(window.paypal)
    script.onerror = () => reject(new Error('Не удалось загрузить PayPal'))
    document.body.appendChild(script)
  })
  return sdkPromise
}

export default function PayPalSubscribeButton({ onActivated, onError }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [notConfigured, setNotConfigured] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID || !PLAN_ID) {
      setNotConfigured(true)
      setLoading(false)
      return
    }
    let cancelled = false
    loadPayPalSdk()
      .then((paypal) => {
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = ''
        paypal
          .Buttons({
            style: { shape: 'pill', color: 'gold', layout: 'horizontal', label: 'subscribe' },
            createSubscription: (_data, actions) => actions.subscription.create({ plan_id: PLAN_ID }),
            onApprove: async (data) => {
              try {
                await confirmPaypalSubscription(data.subscriptionID)
                onActivated?.()
              } catch (e) {
                onError?.(e.message || 'Не удалось подтвердить подписку')
              }
            },
            onError: () => onError?.('PayPal сообщил об ошибке. Попробуй ещё раз.'),
          })
          .render(containerRef.current)
        setLoading(false)
      })
      .catch((e) => {
        if (!cancelled) {
          onError?.(e.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [onActivated, onError])

  if (notConfigured) {
    return <p className="text-sm text-on-surface-variant/70">Оплата подпиской скоро будет доступна.</p>
  }

  return (
    <div>
      {loading && (
        <p className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="size-4 animate-spin" /> Загружаю PayPal…
        </p>
      )}
      <div ref={containerRef} />
    </div>
  )
}
