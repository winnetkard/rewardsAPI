const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.json())

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
app.use(requestLogger)

// Rewards keeps track of all the rewards that have not been used
let rewards = []
// Spent keeps track of all the rewards that have been used
let spent = []

// Main API page
app.get('/', (req, res) => {
  res.send('<h1>Fetch Rewards Coding Exercise</h1>')
})

// Shows all the rewards that have not been used in the system
app.get('/api/rewards', (req, res) => {
  res.json(rewards)
})

// Shows all the rewards that have been used
app.get('/api/spent', (req, res) => {
  res.json(spent)
})

// Shows the current balance by Payer 
app.get('/api/rewards/balance', (req, res) => {
  // Shows the balance of each Payer in Rewards
  const reward = Array.from(rewards.reduce(
    (m, {payer, points}) => m.set(payer, (m.get(payer) || 0) + points), new Map
  ), ([payer, points]) => ({payer, points}));
  let balance = {}
  for (let i = 0; i < reward.length; i++){
    let newPair = {}
    newPair[reward[i].payer] = reward[i].points
    balance = {...balance, ...newPair} 
  }
  // Checks if there is any Payer that is no longer in Rewards, and if there is, adds back to the Balance with 0 points
  var payers = []
  spent.forEach(function(obj){
    payers.push(obj.payer)
  })
  payers = [... new Set(payers)]
  for (let i = 0; i < payers.length; i++){
    if (!(balance[payers[i]])){
      let newPair = {}
      newPair[payers[i]] = 0
      balance = {...balance, ...newPair}
    }
  }
  // Returns updated Balance with Payers with 0 points that are no longer in Rewards
  res.json(balance)
})

// This function is later used to efficently add & update transactions. Uses binary search to determine where the transaction should be added in Rewards 
function bin_search(target, notes, low = 0, high = (notes.length)-1) {
  if (low == high) {
    if (target > notes[low]) {
      return low+1;  
    }
    else {
      return low;
    }
  }
  let mid = low + Math.floor((high-low)/2);
  if (notes[mid] < target){
    return bin_search(target, notes, mid+1, high);
  }
  if (notes[mid] > target){
    return bin_search(target, notes, low, mid);
  }
  return mid
}

// Depending on the input data structure, the function either adds a transaction or spend points
app.post('/api/rewards', (request, response) => {
  const body = request.body
  // If there is payer, timestamp (in Date format), and points data that is an integer (which can be changed to float), the function will check if there is enough Payer balance and add it if the balance does not go below zero 
  if (body.payer != null && body.points != null && body.timestamp != null && Number.isInteger(body.points) && Date.parse(body.timestamp)){
    const reward = {
      payer: body.payer,
      points: body.points,
      timestamp: body.timestamp,
    }
    // balance tracks each payer's balance
    const balanceCheck = Array.from(rewards.reduce(
      (m, {payer, points}) => m.set(payer, (m.get(payer) || 0) + points), new Map
    ), ([payer, points]) => ({payer, points}));
    let balance = {}
    for (let i = 0; i < balanceCheck.length; i++){
      let newPair = {}
      newPair[balanceCheck[i].payer] = balanceCheck[i].points
      balance = {...balance, ...newPair} 
    }
    // If a payers's balance exists but it's smaller than the negative reward points that's being added, the system notifies the end user that there is not enough balance for that payer
    if (balance[reward.payer] && (balance[reward.payer] < -reward.points)){
        response.status(400).send({ error: 'Not enough payer balance' })
    }
    // If a payer's balance does not exist and the reward that's being added is negative, the system notifies the end user that there is not enough balance for that payer
    else if (!(balance[reward.payer]) && reward.points < 0){
        response.status(400).send({ error: 'Not enough payer balance' })
    }
    // If (the payers's balance does not exists and the reward being added is zero or positive) or (the payer's balance exists and the balance being added id greater or equal to the negative reward points that's being added) 
    else {
      // If there no item in rewards,add it to rewards
      if (rewards.length == 0){ 
      rewards = rewards.concat(reward)
      // Returns all the transactions that are currently in rewards (couold be removed if not needed)
      response.json(rewards)
      }
      // If Rewards has one or more item, determine where the new item should go in based on it's timestamp (sorted in chronological order )and insert to Rewards 
      else {
        const rewardlist = rewards.map(reward => reward.timestamp)
        let insert_index = bin_search(body.timestamp, rewardlist)
        if (insert_index > rewards.length) {
          rewards = rewards.concat(note)
        }
        else {
        const insert = (arr, index, newItem) => [
            ...arr.slice(0, index), 
            newItem, 
            ...arr.slice(index)
        ]
        rewards = insert(rewards, insert_index, reward)
        }      
        // Returns all the transactions that are currently in rewards (couold be removed if not needed)
        response.json(rewards)
      }
    }
  }
  // If there is no payer and timestamp data but there is points data that is an integer (which can be changed to float), the function will check if there is enough balance and spend it if there is enough balance
  else if (body.payer == null && body.points != null && body.timestamp == null && Number.isInteger(body.points)) {
    const reward = {
      points: body.points
    }
    // totalPoints is the current account balance
    const totalPoints = rewards.reduce((sum, reward) => sum + reward.points, 0);
    // If the current account balance is less than the spend amount, it will throw an error and notify the end user that there is not enough balance
    if (totalPoints < reward.points){
      response.status(400).send({ error: 'Not enough balance' })
    }  
    // If the current account balance is greater, Rewards will be updated to reflect the spend amount
    else{      
      // Spend keeps track of the spend amount
      let spend = []
      // Remove keeps track of all the transactions that will need to be spent and therefore should be removed  
      let remove = []
      // Update keeps track of all the transactions that will need to be updated. This happens when the transaction amount happens to be greater than the remaining spend amount
      let update = []
      // Keeps track of all the payer balances that hit zero, which notifies the system that all of the other transactions for that payer should be removed
      let zeroBalance = []
      let i = 0
      // date is used to keep track of when the points were spent
      const date = new Date()
      // Keeps track of the remaining spend balance
      let balance = reward.points
      // payerBalance will keep track of each payer's balance. This is needed because no payer's balance can go below zero
      const rewardTotal = Array.from(rewards.reduce(
        (m, {payer, points}) => m.set(payer, (m.get(payer) || 0) + points), new Map
      ), ([payer, points]) => ({payer, points}));
      let payerBalance = {}
      for (let i = 0; i < rewardTotal.length; i++){
        let newPair = {}
        newPair[rewardTotal[i].payer] = rewardTotal[i].points
        payerBalance = {...payerBalance, ...newPair} 
      }    
      // Because Rewards is sorted in chronological order, function will start from the beginnig of the list to see if the oldest points can be spent first
      while (balance > 0) {
        // If the transaction's points are smaller than the remaining balance and its payer balance, then the transaction's entire points can be used
        if (rewards[i].points <= balance) {
          if (rewards[i].points < payerBalance[rewards[i].payer] && payerBalance[rewards[i].payer] > 0){
            let pointsSpent = {
              payer: rewards[i].payer,
              points: rewards[i].points, 
              // timestamp is updated here to indicate what date the points were spent
              timestamp: date
            }
            let newPair = {}
            // payer Balance is updated to reflect the spent points
            newPair[rewards[i].payer] = payerBalance[rewards[i].payer] - rewards[i].points
            payerBalance = {...payerBalance, ...newPair}
            // The transaction that was used is added to remove, so it can be removed later once the balance reaches zero
            remove = remove.concat(rewards[i])
            // The transaction is added to spend to keep track of all the points that will be spent 
            spend = spend.concat(pointsSpent)
            // balance is updated to keep track of the remaining balance
            balance -= pointsSpent.points
          }
          else{
            // If the transaction's points are smaller than the remaining balance but greater or equal to its payer balance, then only the amount equal to the payer's balance can be used from the transaction 
            if (rewards[i].points >= payerBalance[rewards[i].payer] && payerBalance[rewards[i].payer] > 0){
              let pointsSpent = {
                payer: rewards[i].payer,
                points: payerBalance[rewards[i].payer], 
                timestamp: date
              }
              let newPair = {}
              // update payer's balance to zero as all of its balance is used
              newPair[rewards[i].payer] = 0
              payerBalance = {...payerBalance, ...newPair}
              // add the payer to zeroBalance as the remaining balances will need to be removed later, as their sum equals to zero
              zeroBalance = [...zeroBalance, rewards[i].payer] 
              remove = remove.concat(rewards[i])
              spend = spend.concat(pointsSpent)
              balance -= pointsSpent.points
              }
            }
          }
        else {
          // If the transaction's points are greater than the remaining balance but smaller than its payer balance, then only the amount equal to the remaining balance can used from the transaction
          if (rewards[i].points < payerBalance[rewards[i].payer] && payerBalance[rewards[i].payer] > 0){
            let pointsSpent = {
              payer: rewards[i].payer,
              points: balance, 
              timestamp: date
            }
            // Because the transaction's not fully used and the payer's remaining balance does not zero, the transaction will need ot be updated with the updated points value
            let pointsUpdate = {
              payer: rewards[i].payer,
              points: rewards[i].points-balance, 
              timestamp: rewards[i].timestamp
            }
            let newPair = {}
            newPair[rewards[i].payer] = payerBalance[rewards[i].payer] - balance
            payerBalance = {...payerBalance, ...newPair}
            remove = remove.concat(rewards[i]) 
            spend = spend.concat(pointsSpent)
            // The transaction with the updated value will be added to update so it can be added to rewards later
            update = update.concat(pointsUpdate)
            balance -= pointsSpent.points
          }
          // If the transaction's points are greater than the remaining balance and greater than or equal to its payer balance, then only the amount equal to the payer balance can used from the transaction
          else if (rewards[i].points >= payerBalance[rewards[i].payer] && payerBalance[rewards[i].payer] > 0){
            // If the payerBalance is greater than the remaining balance, the amount equal to balance can be used fron the trasaction, and the transaction will need to be updated
            if (payerBalance[rewards[i].payer] > balance){
              let pointsSpent = {
                payer: rewards[i].payer,
                points: balance, 
                timestamp: date
              }
              let pointsUpdate = {
                payer: rewards[i].payer,
                points: rewards[i].points-balance, 
                timestamp: rewards[i].timestamp
              }
              let newPair = {}
              newPair[rewards[i].payer] = payerBalance[rewards[i].payer] - balance
              payerBalance = {...payerBalance, ...newPair}
              remove = remove.concat(rewards[i]) 
              spend = spend.concat(pointsSpent)
              update = update.concat(pointsUpdate)
              balance -= pointsSpent.points
              }
            // If the payerBalance is equal remaining balance, the amount equal to balance can be used fron the trasaction, and the transaction's payer values will need to be removed as its payer value zero'ed
            else if (payerBalance[rewards[i].payer] == balance){
              let pointsSpent = {
                payer: rewards[i].payer,
                points: balance, 
                timestamp: date
              }
              let newPair = {}
              newPair[rewards[i].payer] = 0
              zeroBalance = [...zeroBalance, rewards[i].payer]
              payerBalance = {...payerBalance, ...newPair}
              remove = remove.concat(rewards[i]) 
              spend = spend.concat(pointsSpent)
              balance -= pointsSpent.points
              }
            // If the payerBalance is smaller than remaining balance, the amount equal to the payer's balance can be used fron the trasaction, and the transaction's payer values will need to be removed as its payer value zero'ed  
            else {
                let pointsSpent = {
                  payer: rewards[i].payer,
                  points: payerBalance[rewards[i].payer], 
                  timestamp: date
                }
                let newPair = {}
                newPair[rewards[i].payer] = 0
                payerBalance = {...payerBalance, ...newPair}
                zeroBalance = [...zeroBalance, rewards[i].payer] 
                remove = remove.concat(rewards[i])
                spend = spend.concat(pointsSpent)
                balance -= pointsSpent.points
              }
            }
          } 
        i++;
      }
      // All the transactions spent will be added to Spent with an updated date
      spent = spent.concat(spend)
      // The transactions are grouped by Payers
      const returnSpent = Array.from(spend.reduce(
        (m, {payer, points}) => m.set(payer, (m.get(payer) || 0) - points), new Map
      ), ([payer, points]) => ({payer, points}));
      // All the values kept in remove is removed from Rewards
      for (let i=0; i < remove.length; i++){
        rewards = rewards.filter(reward => !(reward.payer == remove[i].payer && reward.points == remove[i].points && reward.timestamp == remove[i].timestamp))
      }      
      // All the transactions that have a Payer in zeroBalance is removed from Rewards
      if (zeroBalance.length > 0) {
        zeroBalance = [...new Set(zeroBalance)]
        for (let i=0; i < zeroBalance.length; i++){
          rewards = rewards.filter(reward => !(reward.payer == zeroBalance[i]))
        }
      }
      // All the values in update are added back to Rewards
      if (update.length == 1){
        if (rewards.length == 0){ 
          rewards = rewards.concat(update[0])
          }
        else {
            const rewardlist = rewards.map(reward => reward.timestamp)
            let insert_index = bin_search(update[0].timestamp, rewardlist)
            if (insert_index > rewards.length) {
              rewards = rewards.concat(update[0])
            }
            else {
            const insert = (arr, index, newItem) => [
                ...arr.slice(0, index), 
                newItem, 
                ...arr.slice(index)
            ]
            rewards = insert(rewards, insert_index, update[0])
            }      
          }
        }
      // All the transactions that were spent are returned  
      response.json(returnSpent)
    }
  }
  // If the request data doesn't meet any of the formats above, it will indicate that it's in invalid input format
  else{
    response.status(400).send({ error: 'invalid input type' })
    }
  }
)
// If the request format doesn't follow any of the formats above, it will indicate that the request type is invalid
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})