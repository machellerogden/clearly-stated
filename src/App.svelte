<script>
  import Canvas from './lib/Canvas.svelte'
  import { buildAdjacency } from './lib/model/analysis.js'

  // A basic state machine definition
  const definition = {
    "StartAt": "PrepareInput",
    "States": {
        "PrepareInput": {
            "Type": "Pass",
            "Parameters": {
                "order.$": "$"
            },
            "Next": "ValidateOrder"
        },
        "ValidateOrder": {
            "Type": "Task",
            "Resource": "validateOrder",
            "InputPath": "$.order",
            "ResultPath": "$.order",
            "Next": "ProcessPayment"
        },
        "ProcessPayment": {
            "Type": "Task",
            "Resource": "processPayment",
            "InputPath": "$.order",
            "ResultPath": "$.paymentResult",
            "Next": "IsPaymentSuccessful"
        },
        "IsPaymentSuccessful": {
            "Type": "Choice",
            "Choices": [
                {
                    "Variable": "$.paymentResult.success",
                    "BooleanEquals": true,
                    "Next": "CheckStock"
                }
            ],
            "Default": "CancelOrder"
        },
        "CheckStock": {
            "Type": "Task",
            "Resource": "checkStock",
            "InputPath": "$.order",
            "ResultPath": "$.stockCheckResult",
            "Next": "IsStockAvailable"
        },
        "IsStockAvailable": {
            "Type": "Choice",
            "Choices": [
                {
                    "Variable": "$.stockCheckResult.available",
                    "BooleanEquals": true,
                    "Next": "ShipOrder"
                }
            ],
            "Default": "NotifyOutOfStock"
        },
        "ShipOrder": {
            "Type": "Task",
            "Resource": "shipOrder",
            "InputPath": "$.order",
            "ResultPath": "$.shippingInfo",
            "Next": "OrderComplete"
        },
        "NotifyOutOfStock": {
            "Type": "Task",
            "Resource": "notifyOutOfStock",
            "InputPath": "$.order",
            "End": true
        },
        "CancelOrder": {
            "Type": "Task",
            "Resource": "cancelOrder",
            "InputPath": "$.order",
            "ResultPath": "$.cancelationInfo",
            "End": true
        },
        "OrderComplete": {
            "Type": "Pass",
            "Result": "Order has been successfully processed and shipped.",
            "End": true
        }
    }
}


  // Build adjacency from definition
  const { adjacency, start } = buildAdjacency(definition)

  // We'll pass a data object to show node type
  const nodeData = {}
  for (const [id, state] of Object.entries(definition.States)) {
    nodeData[id] = { Type: state.Type }
  }

  let detailLevel = 1
</script>

<main>
  <h1>State Machine Visualization</h1>
  <label for="detail">Detail Level: {detailLevel}</label>
  <input type="range" min="0" max="2" bind:value={detailLevel} id="detail" />
  <Canvas
    adjacency={adjacency}
    nodeData={nodeData}
    start={start}
    {detailLevel}
  />
</main>
