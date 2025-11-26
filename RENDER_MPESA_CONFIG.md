# M-Pesa Configuration for Render Deployment

## Add These Environment Variables to Render

Go to: **Render Dashboard** → **wakili-pro (backend)** → **Environment** → **Add Environment Variable**

### Required Variables:

```
MPESA_CONSUMER_KEY
N9ro1AXVEhD5vJFO5PRLlVYU6z7zINsd4GRtX6Y9XoAdr4YP
```

```
MPESA_CONSUMER_SECRET
AaZE6zkQ6LevgbSTNhEU2sv9AiUMuUoBnpCF2p7TimEB2fiA5QdZazm51d2v5WOG
```

```
MPESA_SHORTCODE
174379
```

```
MPESA_PASSKEY
bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

```
MPESA_ENVIRONMENT
sandbox
```

```
MPESA_CALLBACK_URL
https://wakili-pro.onrender.com/api/payments/mpesa/callback
```

```
MPESA_TIMEOUT_URL
https://wakili-pro.onrender.com/api/payments/mpesa/timeout
```

---

## After Adding Variables:

1. **Save changes** (Render will auto-deploy)
2. **Wait 2-3 minutes** for deployment
3. **Test payment** at: https://wakili-pro-1.onrender.com

---

## Test Payment:

Use these sandbox credentials:

- **Phone Number**: `254708374149` (or any 2547... number)
- **Amount**: `100` (or any amount up to 70000)
- **Note**: In sandbox mode, you'll get a simulated STK push response

---

## Verify Callbacks Work:

Your callback URL is now publicly accessible:
- **Callback**: `https://wakili-pro.onrender.com/api/payments/mpesa/callback`
- **Timeout**: `https://wakili-pro.onrender.com/api/payments/mpesa/timeout`

Safaricom will send payment confirmations to these URLs automatically.

---

## Check Logs:

After deployment, monitor M-Pesa activity:
- Render Dashboard → **Logs** tab
- Look for: `M-Pesa`, `STK Push`, `callback`

---

✅ **You're all set!** The credentials are saved locally in `.env` and ready to be added to Render.
