package expo.modules.playbilling

import android.os.Handler
import android.os.Looper
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Ponte Expo per Google Play Billing Library 9.
 *
 * Questo modulo non concede licenze né salva token come validi: il chiamante deve
 * inviare il purchase token a un backend sicuro, verificare l'entitlement e solo
 * dopo richiedere l'acknowledgement al client. In questo modo un acquisto non può
 * essere simulato con il solo storage locale dell'app.
 */
class PlayBillingModule : Module(), PurchasesUpdatedListener {
  private var billingClient: BillingClient? = null
  private val detailsCache = mutableMapOf<String, ProductDetails>()
  private var purchasePromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("TotemPlayBilling")

    AsyncFunction("isAvailable") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      withClient(
        onReady = { client ->
          val subscriptions = client.isFeatureSupported(BillingClient.FeatureType.SUBSCRIPTIONS)
          promise.resolve(subscriptions.responseCode == BillingClient.BillingResponseCode.OK)
        },
        onError = { promise.resolve(false) }
      )
    }

    AsyncFunction("querySubscriptions") { rawProductIds: List<String>, promise: Promise ->
      val productIds = rawProductIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()
      if (productIds.isEmpty()) {
        promise.resolve(mapOf("ok" to false, "code" to "CONFIGURATION_MISSING", "message" to "Nessun ID prodotto Play configurato.", "products" to emptyList<Map<String, Any>>()))
        return@AsyncFunction
      }
      withClient(
        onReady = { client ->
          val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productIds.map { productId ->
              QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
            })
            .build()
          client.queryProductDetailsAsync(params) { result, queryResult ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) {
              promise.resolve(resultPayload(result, emptyList()))
              return@queryProductDetailsAsync
            }
            val products = queryResult.productDetailsList.map { details ->
              detailsCache[details.productId] = details
              productPayload(details)
            }
            val unavailable = queryResult.unfetchedProductList.map { unfetched ->
              mapOf(
                "productId" to unfetched.productId,
                "responseCode" to unfetched.statusCode,
              )
            }
            promise.resolve(
              mapOf(
                "ok" to true,
                "code" to "OK",
                "message" to "ProductDetails ricevuti da Google Play.",
                "products" to products,
                "unavailableProducts" to unavailable,
              )
            )
          }
        },
        onError = { promise.resolve(it) }
      )
    }

    AsyncFunction("startSubscriptionPurchase") { productId: String, offerToken: String?, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(mapOf("ok" to false, "code" to "ACTIVITY_UNAVAILABLE", "message" to "Schermata Android non disponibile per l'acquisto."))
        return@AsyncFunction
      }
      withClient(
        onReady = { client ->
          val details = detailsCache[productId]
          if (details == null) {
            promise.resolve(mapOf("ok" to false, "code" to "PRODUCT_DETAILS_STALE", "message" to "Aggiorna i piani da Google Play prima dell'acquisto."))
            return@withClient
          }
          val offer = details.subscriptionOfferDetails
            ?.firstOrNull { it.offerToken == offerToken }
            ?: details.subscriptionOfferDetails?.firstOrNull()
          if (offer == null) {
            promise.resolve(mapOf("ok" to false, "code" to "OFFER_UNAVAILABLE", "message" to "Nessuna offerta di abbonamento idonea è disponibile per questo account."))
            return@withClient
          }
          if (purchasePromise != null) {
            promise.resolve(mapOf("ok" to false, "code" to "FLOW_IN_PROGRESS", "message" to "Un acquisto è già in corso."))
            return@withClient
          }
          val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
              listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                  .setProductDetails(details)
                  .setOfferToken(offer.offerToken)
                  .build()
              )
            )
            .build()
          purchasePromise = promise
          val result = client.launchBillingFlow(activity, flowParams)
          if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            purchasePromise = null
            promise.resolve(resultPayload(result, emptyList()))
          }
        },
        onError = { promise.resolve(it) }
      )
    }

    AsyncFunction("queryActiveSubscriptions") { promise: Promise ->
      withClient(
        onReady = { client ->
          val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
          client.queryPurchasesAsync(params) { result, purchases ->
            promise.resolve(resultPayload(result, purchases.map(::purchasePayload)))
          }
        },
        onError = { promise.resolve(it) }
      )
    }

    AsyncFunction("acknowledgePurchase") { purchaseToken: String, promise: Promise ->
      if (purchaseToken.isBlank()) {
        promise.resolve(mapOf("ok" to false, "code" to "TOKEN_MISSING", "message" to "Token di acquisto assente."))
        return@AsyncFunction
      }
      withClient(
        onReady = { client ->
          val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchaseToken)
            .build()
          client.acknowledgePurchase(params) { result ->
            promise.resolve(resultPayload(result, emptyList()))
          }
        },
        onError = { promise.resolve(it) }
      )
    }

    OnDestroy {
      purchasePromise?.resolve(mapOf("ok" to false, "code" to "CLIENT_CLOSED", "message" to "Servizio Google Play chiuso."))
      purchasePromise = null
      billingClient?.endConnection()
      billingClient = null
      detailsCache.clear()
    }
  }

  override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
    val pending = purchasePromise ?: return
    purchasePromise = null
    if (result.responseCode != BillingClient.BillingResponseCode.OK || purchases == null) {
      pending.resolve(resultPayload(result, emptyList()))
      return
    }
    pending.resolve(resultPayload(result, purchases.map(::purchasePayload)))
  }

  private fun withClient(
    onReady: (BillingClient) -> Unit,
    onError: (Map<String, Any>) -> Unit,
  ) {
    val context = appContext.reactContext
    if (context == null) {
      onError(mapOf("ok" to false, "code" to "CONTEXT_UNAVAILABLE", "message" to "Contesto Android non disponibile."))
      return
    }
    val run = Runnable {
      val client = getOrCreateClient(context)
      if (client.isReady) {
        onReady(client)
        return@Runnable
      }
      client.startConnection(object : BillingClientStateListener {
        override fun onBillingSetupFinished(result: BillingResult) {
          if (result.responseCode == BillingClient.BillingResponseCode.OK) onReady(client)
          else onError(resultPayload(result, emptyList()))
        }

        override fun onBillingServiceDisconnected() {
          // La reconnessione è gestita automaticamente da Billing Library 9.
        }
      })
    }
    if (Looper.myLooper() == Looper.getMainLooper()) run.run()
    else Handler(Looper.getMainLooper()).post(run)
  }

  private fun getOrCreateClient(context: android.content.Context): BillingClient {
    billingClient?.let { return it }
    return BillingClient.newBuilder(context.applicationContext)
      .setListener(this)
      .enablePendingPurchases(
        PendingPurchasesParams.newBuilder()
          .enableOneTimeProducts()
          .build()
      )
      .enableAutoServiceReconnection()
      .build()
      .also { billingClient = it }
  }

  private fun resultPayload(result: BillingResult, purchases: List<Map<String, Any>>): Map<String, Any> = mapOf(
    "ok" to (result.responseCode == BillingClient.BillingResponseCode.OK),
    "code" to result.responseCode.toString(),
    "message" to (result.debugMessage.ifBlank { "Risposta Google Play: ${result.responseCode}" }),
    "purchases" to purchases,
  )

  private fun productPayload(details: ProductDetails): Map<String, Any> {
    val offers = details.subscriptionOfferDetails.orEmpty().map { offer ->
      mapOf(
        "offerToken" to offer.offerToken,
        "basePlanId" to offer.basePlanId,
        "offerId" to (offer.offerId ?: ""),
        "pricingPhases" to offer.pricingPhases.pricingPhaseList.map { phase ->
          mapOf(
            "formattedPrice" to phase.formattedPrice,
            "billingPeriod" to phase.billingPeriod,
            "recurrenceMode" to phase.recurrenceMode.toString(),
            "priceAmountMicros" to phase.priceAmountMicros.toString(),
            "priceCurrencyCode" to phase.priceCurrencyCode,
          )
        },
      )
    }
    return mapOf(
      "productId" to details.productId,
      "title" to details.title,
      "description" to details.description,
      "offers" to offers,
    )
  }

  private fun purchasePayload(purchase: Purchase): Map<String, Any> = mapOf(
    "purchaseToken" to purchase.purchaseToken,
    "products" to purchase.products,
    "orderId" to (purchase.orderId ?: ""),
    "purchaseState" to purchase.purchaseState,
    "isAcknowledged" to purchase.isAcknowledged,
    "purchaseTime" to purchase.purchaseTime.toString(),
  )
}
