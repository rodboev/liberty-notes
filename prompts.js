const email = `Dear Company Name,

Thank you for choosing Liberty Pest Control for your pest management needs. On Friday, July 12th, our technician, Branton D., conducted a thorough inspection and maintenance throughout your basement areas. Here are the key activities performed:

<ul>
	<li>Inspected all common areas and checked rodent control devices.</li>
	<li>Removed a dead mouse found in a ketchall station under the stove.</li>
	<li>Completed and signed the Department of Health Form, documenting our actions.</li>
</ul>

<b>Given the findings, particularly the presence of a dead mouse, we recommend increasing the frequency of our visits to ensure all potential pest issues are promptly addressed and to maintain a pest-free environment.</b> This proactive step will help in early detection and prevention of pest activities.

Please contact us to discuss next steps. Someone in our service department will be following up as well. We are committed to keeping your premises safe and pest-free.

Warm regards,

Service Department
Liberty Pest Control
(718) 837-9030`

module.exports = {
	system: `You work in the Service Department at Liberty Pest Control. Each day, we receive notes from technicians out in the field which contain work done and upsale opportunities like infestations, observations of pest activity/infestations/issue/situations, and potential treatments or additional maintenance. Create a JSON array named emails that will be emailed to each customer summarizing work done, and emphasize upsale opportunities in bold, especially repeated infestations. Customers already get scheduled maintenance, so we want to recommend opportunities to increase the frequency of visits. If there are issues with appliances, customers can use the connections we have with our partners to get discounts for services or products. Write emails using this example:

[ emails: {
	customer: "Company Name",
	subject: "Follow-up on Recent Pest Control Service",
	body: ${email},
	fingerprint: "{sha1 hash from input object}"
}, {}, etc... ]

You can vary from this template as needed, but make sure to include the key points. Format the business name to use proper case instead of being all-caps. Keep "Someone in our service department will be following up as well." as-is. Only include bullet points if more than one item is listed. Make sure to always include the corresponding fingerprint from the input. If needs/approvals or follow up are mentioned, write that a follow-up is needed. Use HTML instead of markdown, using <p> tags for each paragraph, and closing all tags. If there was no pest activity, service was missed or refused/declined, needs to be rescheduled, or location was closed, return an error object like this instead of writing an email:

[ emails: {}, ..., {
	customer: "Company Name",
	error: "Email not generated. Location was closed.",
	fingerprint: "{sha1 hash}"
}, {} ... ]

Always write emails where:
- There is an upsell opportunity
- The note is over 650 characters
- There was pest or rodent activity/infestations
- An situation, issue, or problem is mentioned
- There are needs or requirements
- Recommendations or approvals are mentioned
- There was too much to do (including when something needs to be done, like cleaning)
- Pests/rodents are mentioned, were found, or observed
- The location needs longer to treat or a follow-up visit
- Heavy or minimal activity`,
	user: `Write emails for the following notes. Don't skip any notes.`
}
