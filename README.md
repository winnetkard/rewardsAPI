# rewardsAPI


This backend server is hosted on https://fetchrewardsbackendexercise.herokuapp.com/

You can make the following requests:

  1. Add transaction by:
  
    POST https://fetchrewardsbackendexercise.herokuapp.com/api/rewards
    Content-Type: application/json
    { "payer": "Payer", "points": ###, "timestamp": Dateformat }
   
  2. Spend point by:
  
    POST https://fetchrewardsbackendexercise.herokuapp.com/api/rewards
    Content-Type: application/json
    { "points": 5000 }
    
  3. Check balance by:
  
    GET https://fetchrewardsbackendexercise.herokuapp.com/api/rewards/balance
    
All the examples that were used in the exercise instructions pdf can be found in https://github.com/winnetkard/rewardsAPI/tree/main/requests

Please contact winnetkard@gmail.com if you're having issues with the server

Thanks!
