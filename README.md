# RoyaltyCalc
A system for tabulating book royalties written in NodeJS, Angular, the Jade templating library, and utilizing the Sequelize library as a MySQL interface.

It utilizes `openexchangerates.org` to provide payments to vendors based on their currency exchange vs.
individual line item amounts on the day of payment.

It is rough, and doesn't support nearly the amount of environment-friendly config that I would like, but it works great once configred and in production.

The workflow for the system according to a five-step process:

1) The admin creates vendors for each company that resells the company's products (books/ebooks/comics) that requires a quarterly royalty to be awarded.

2) The admin maps each cell in the spreadsheets to the corresponding system field (e.g. sale price, quantity sold, total royalty paid, author's name)

3) The admin uploads spreadsheets in Excel, Tab-delimited text, or CSV format for each Vendor under the "Files" tab using drag-and-drop.  Each file is then "processed" and royalties are calculated for each author.

4) The admin then approves each author after their royalties match expected results using the preview function during the verification phase.

5) After all authors are approved, the admin generates user PDFs, then downloads a consolidated ZIP file for that quarter.  PDFs are then distributed via e-mail and the web.

---
# Setup

1) Copy the .env.example to .env and edit the DB_URL to point to an empty MySQL DB.
2) `npm install`
3) `npm start`

