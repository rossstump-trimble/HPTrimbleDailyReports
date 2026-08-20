

I need to expand this app to include a few core features.

The first function in this system should be to intake daily report information 
- speech to text is one route - scan upload / image ingestion going through gemini api vision models (gemini 3.7 flash)
- I want the system to be able to call a phone number on trigger (button in the app, with entry for phone number to call) which asks them questions and they do speech to text to responder
- I want them also to ba able to do speech to text in the core web browser
- I also want the option to trigger a text sequence that sends someone questions and they respond via text to the system
- As part of texting them or calling them I want to be able to trigger it or schedule it for certain days of the week and certain timestamped

This needs to conver multiple subcontractors - it needs to collect daily reports from them including the data needed to fill out the form I'll give you later
Give me some way to manage the list of subs and configure this for each one - or step in for each one and upload their file or talk to explain their daily report features
The page should include prompting on what needs to be specified 

The full subset of key data is required. Phone calling is not important for today, but talk to the agent and asking you questions should be working through the Google Gemini / google api platform if possible.

This system will also include some notion of data and insights. I want to have a tracking dashboard of which subs have finished their reports which handles filling those fields out over time and tracking which trade partners are overdue for a report.

The core features for a daily is 

We need to have people explain who they are - company name and their name
We should ask them what project they are working on - by name - we need to match these names to a jobsite
Total worker count with names and titles for each 
total hours worked and split for workers / how long the day is
Delay notes - what is delayed and why and for how long
equipment used / equipment they have on site to do this work
Safety report - explanation of safety specifics and a confirmation that safety meeting happened for the day 
Location and description of project
Coordination / timing issues with otehr subs
discrepencies from the plan or current schedule etc - issues
weather (using xweather - same key as compliant scheduling is using for the scheduling application)

Each job should have a generated qr code shown on the main screen which identifies that job and an admin (anyone for now) can create a new project - the first page should show a project list of factive projects each will have a QR

There needs to be fuzzy matching on trade partner names and things should be crossreferenced by job they are working on.

And when someone fills out the report they should have the ability to send the email copy of the report to 1 or ore email adresses - probably a their onw comapnies

All this should feed in thte bowling report - which i will give you a copy of to explain how it works - its the cobined daily report fot eh whoel yproject (per proejct)

-- We need some version of alerta and the ability to alert a site engineer to be asked to follow up with people or do a tast

I think date will beed to be input 

Each project should have the ability to have site speific wquestions related just to that project

Each project needs to have a way to set up mandatory fields but with a standard templated subset 

How many peopke on site, what did you do , what equipment was used.

Needs to tell us where you worked and what you worked on. "200ft of gas piping installed on a bank near the edge of site"

Always want to collect notes

- we dont ask the user for the weather - we dont ask them directly for delays or discrepencies, that should be included in the notes) 

We should ask them if they completed an STA (safety)

Admin mode should be toggle in the settings in the first version of this - strip away the original projectsight functionality but use the styling and header and frames and tab managmenent system so it all feels cohesive. 

Give us a basic data science - reporting type system to see the status of a system like this.

Date should be default - but they might want to backdate.

need to capture email address to send confirmation to or more than 1
"would you like an email copy? where should we send it?"

All this is used to fill out the form - update the bowling sheet template structure.

Do the check as they fill out the records - is this the same customer record in PS

Maybe some claiming system to catch orphaned trade partners in the frontend qa qc

We want to add a risk management dashboard - by # of missing reports - by quantifiying how certiain patterns map to risky  potenentailly problematic behaviours and summaries.

