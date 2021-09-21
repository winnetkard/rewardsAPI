# rewardsAPI


This backend server is hosted on https://fetchrewardsbackendexercise.herokuapp.com/

You can make the following requests:

1. Add a transaction by:
  
    POST https://fetchrewardsbackendexercise.herokuapp.com/api/rewards
    Content-Type: application/json
    { "payer": "Payer", "points": ###, "timestamp": DateinDateformat }
    
If you're successfully able to add a transaction, the server will send a list of transactions that can be used. 
   
2. Spend points by:
  
    POST https://fetchrewardsbackendexercise.herokuapp.com/api/rewards
    Content-Type: application/json
    { "points": ### }
    
If you're succesfully able to spend points, the server will send a list of points that are deducted from each payer. 
    
3. Check the current balance by:
  
    GET https://fetchrewardsbackendexercise.herokuapp.com/api/rewards/balance
    
If you're succesfully able to check the current balance, the server will send a list of each payer's balance.
    
All the examples that were used in the exercise instructions pdf can be found in https://github.com/winnetkard/rewardsAPI/tree/main/requests

Please contact winnetkard@gmail.com if you have any issues with accessing the server

Thanks!
