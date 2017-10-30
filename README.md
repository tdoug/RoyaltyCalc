# RoyaltyCalc
A system for tabulating book royalties written in NodeJS, Angular, the Jade templating library, and utilizing the Sequelize library as a MySQL interface.

The workflow for the system according to a five-step process:

1) The admin creates vendors for each company that resells the company's products (books/ebooks/comics) that requires a quarterly royalty to be awarded.

2) The admin maps each cell in the spreadsheets to the corresponding system field (e.g. sale price, quantity sold, total royalty paid, author's name)

3) The admin uploads spreadsheets in Excel, Tab-delimited text, or CSV format for each Vendor under the "Files" tab using drag-and-drop.  Each file is then "processed" and royalties are calculated for each author.

4) The admin then approves each author after their royalties match expected results using the preview function during the verification phase.

5) After all authors are approved, the admin generates user PDFs, then downloads a consolidated ZIP file for that quarter.  PDFs are then distributed via e-mail and the web.

Screenshots of the app's functionality are available in the Screenshots directory.

