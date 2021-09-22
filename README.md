# rewardsAPI


This backend server is hosted on https://fetchrewardsbackendexercise.herokuapp.com/

You can make the following requests:

  1. Add a transaction by:
  
    POST https://fetchrewardsbackendexercise.herokuapp.com/api/rewards
    Content-Type: application/json
    { "payer": "Payer", "points": ###, "timestamp": Date }
    
    If you're successfully able to add a transaction, the server will send a list of transactions that can be used.
    
    "points" need to be an integer (this can be changed) and Date needs to be in ISO format (this can also be changed). 
    
    Please look at transactions(1-5).rest in rewardsAPI/requests for specific examples
   
  2. Spend points by:
  
    POST https://fetchrewardsbackendexercise.herokuapp.com/api/rewards
    Content-Type: application/json
    { "points": ### }
    
    If you're succesfully able to spend points, the server will send a list of points that were deducted from each payer. 
    
    "points" need to be an integer (this can be changed)
    
    Please look at Spend.rest in rewardsAPI/requests for a specific example. 
    
  3. Check the current balance by:
  
    GET https://fetchrewardsbackendexercise.herokuapp.com/api/rewards/balance
    
    If you're succesfully able to check the current balance, the server will send a list of each payer's balance.
    
    Please look at Balance.rest in rewardsAPI/requests for a specific example
    
All the examples that were used in the exercise instructions pdf can be found in rewardsAPI/requests https://github.com/winnetkard/rewardsAPI/tree/main/requests

I have commented throughout index.js on how the server processes requests https://github.com/winnetkard/rewardsAPI/blob/main/index.js 

Please contact winnetkard@gmail.com if you have any issues with accessing the server

Thanks!
