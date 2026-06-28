I want to create a scuba diving planner named diveplanner.

The main goals:
- a tool to plan out days to go diving around Southeast Asia
- that considers which country you are from and what public holidays is available for the next year (default to: Singapore)
- so that you can plan dive trips that coincide with holidays and get a gauge of how many days of annual leave you are using
- and an estimate of how many dives you will be doing (typically: 1 day of travel there where no dives are done, then 1 day of no-fly time then a flight back)
- that also includes a rough calendar map of which locations are good for diving with good visibility during which months (e.g. Tioman is undiveable from Dec to Feb, Malapascua has best visibility from March to June)
- this is so that i can plan my dive trips in advance so that flights are still cheap

Some of good dive sites around SEA that I'm interested in: Tioman, Perhentian, Palau, Koh Tao, Koh Phi Phi, Malapascua, Gili, Amed, Tulamben, Raja Amphet, Sipadan, Komodo, Bunaken, Nusa Penida, Okinawa

Might be good to state whether these dive sites are good for beginners: e.g. higher currents in Komodo or Nusa Penida
and whether visibility is good
and what you might see there e.g. Thresher sharks in Malapascua, Manta Rays in Nusa Penida etc.

Some technical details:
- No server side state; Users should be able to play around and adjust the schedules and have it be stored in localstorage or indexeddb.
- Users should be able to share their dive plan with other users say e.g. with something that compresses their state into a shareable URL like base64 encode


Other requirements:
- Be able to specify how many days of leave you have per year (default: for me its 25 days and max 5 days carry over leave so 30 total per year)
- Be able to mark trips as a normal fundive trip or a course trip (say, Advanced Open Water + Nitrox), or a liveaboard
- In fact be able to mark out date ranges as NON-DIVE LEAVE too, e.g. if im going on a 2 week holiday to say..... Italy that is definitely not for diving, I want to be able to mark out that date range as me being on leave but that 10 days of leave (btw, also account for holidays) is used for non-dives so that i know that my leave balance is X-10 that can be used for diving.

Nice to haves in the future (i dont know which data sources we can get this from and i dont think we can complete these in a single session so just laying it out that this is a future implementation plan, we dont actually need to implement them, just implementing the above features knowing that these might come in the future):
- Flight price estimates
- Travel route from $COUNTRY to $LOCATION (e.g. travelling from Singapore to Tioman requires a 4hour bus ride, then a 2 hour boat ride)
- Best dive shop recommendations in the location
- Best accomodation recommendations in the location with cost estimates (1 for most luxurious - 1 for most value for money, the goal here is to prevent me from staying in dingy locations that have rusty toilets)

Supposed user flow:
1. I feel like planning a dive trip, so I go on the dive planner
2. I see that there is Hari Raya Haji on May 17 2026 and Vesak Day on May 20 2026 on the planning calendar for the next full year.
3. I think that is a good time to go on a dive trip from Saturday May 15 2026 until Sunday May 23 2026
4. I mouseover the date ranges and it shows that Malapascua and Okinawa is good for diving
5. I select that date range for holidaying
6. I see at the top of the page whether I have enough days of leave left. Since this range starts from Saturday, has 2 weekday holidays, stretched until the end of the next weekend Sunday, so we would need 3 days of leave on Weekdays.
7. I see that I have enough days of leave, I confirm adding the trip to the planner as status: PLANNED
8. I go and book the dive shop: Blahblah Divers, I update my planner that I booked with Blahblah Divers
9. I go and book flights: AB123 to and AB324 back, I update my planner that flights are booked
10. I go and book boat to and fro, same I update
11. I go and book accomodations, same I update.
12. Now my trip is state: confirmed
13. I now want to let my friends know, so I click on a share button and send them a link with an encoded state of my dive trips planned next year.


