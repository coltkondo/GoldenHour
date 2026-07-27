# Guide to Building the Contribution Page

This page will talk about how these forms will look and feel in the app. This will include question type, format, answer options.

## Overall Feedback

Stack the options vertically, fill up more space on the screen, bigger text. If you click one of the options, remove all other buttons, have a back button to return to main, but allow the survey to take up the screen. No need for the empty space in the beginning. I get thats where you put the survey, but id rather focus on staying on the survey page rather than accidentally getting off the survey cuz of the current format. Small back button in the top left if you want to leave the form.

## New Deals

Should rename to "New HH Deal"

| Question | Answer Type | Data Type | Notes |
| -------- | ----------- | --------- | ----- |
| Bar name | Dropdown Menu | Text | Dropdown to include only bars in the market|
| Deal Description | Short Text | Text | Read and deciphered |
| Day(s) of the week | Checkboxes | List of Text | Sun through Sat options, check as many as fit |
| Is all day? | Boolean | Text | Yes or No|
| Time Range | Timestamp {HH:MM} | Timestamp | Only show if is all day = no. Two pinpad boxes, one for start, one for end |
| Price Details | Pinpad | Integer | Optional if known. $X.XX |

## New Bar

Throw this towards the bottom of the pack. Not very common

| Question | Answer Type | Data Type | Notes |
| -------- | ----------- | --------- | ----- |
| Bar Name | Short text | Text | Self explanatory |
| Address | Button on Map | Text | Have use current location button, or map where you can drop a pin |
| Deal | Long Text | Text | Must add at least one deal. Idk maybe replace this with a picture of a deal so that we know this place is legit |

## Deal Info Wrong

Need to restructure totally. Ask for Bar first (dropdown like described in line 15), then the date of the discrepant deal (another dropdown), then it will show all the deals at that bar on that day, and you select which deal is wrong, then you propose the edit to said deal (wrong item, wrong price, wrong day, whatever, make it intuitive and easy)

## Bar Info Wrong

Treat it like the above, but simply just ask the bar name first, then show the bar information, and user selects what is wrong and can propose an edit

## Deal Expired

Consolidate this with Deal Info Wrong. When the deal is selected, an option can be "Deal is no longer active"

## Bar Closed

Consolidate with Bar Info Wrong. An option can be "Bar is closed"