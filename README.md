## EPM Metadata Management Demo

This is a demonstration of using Inngest to build a simple enterprise metadata management workflow.
A common problem in enterprise organizations is managing operational metadata about an organization
in automations across the various systems an organization uses. For example, an organization may use a
suite of Enterprise Resource Planing (ERP) tools for day-to-day operational needs, like managing inventory,
order processing, and HR but need to sync metadata between their ERP systems and their Enterprise Performance
Management (EPM) systems for budgeting and forecasting needs.

Teams within these organizations use a wide range of strategies for managing this metadata, from building custom
automation scripts in-house to purchasing purpose-built metadata management products. This repo shows a simple
demo of how Inngest could be used to build a common flow where:

1. A new metadata member is added to some source system (e.g. a new product is added to an inventory management system)
2. Logic is run to determine how to map a metadata member to the target systems (e.g. evaluate the member against mapping rules)
3. A user is optionally asked for input or approval of the new mapping
4. The mapping is recorded to be used in later ETL processes that move data to the target systems

Further this demo explores how agentic LLM usage could derive mapping rules from existing mappings, requiring less user
intervention in metadata management. Using Inngest in combination with an LLM to build metadata management workflows
could enable teams to build powerful workflows without the need for a full-blown metadata management tool.

### Demo App

Visit https://metadata-example-app.kuyk.dev to interact with the demo. Some examples:

1. Entering a new period can be automatically mapped based on previous periods given existing mappings. For example, source=202502 will be automatically mapped to Jan 2025
2. Entering a new cost center, such as source=CC401 has an ambiguous target, so the user will be asked for input
    * Click on the "Click to map" status to map the value to some target value (note: occassionally Inngest takes a few minutes to trigger the waitForEvent step. You might have to refresh after a few minutes.)
3. Entering a new product, such as P201 will automatically be mapped to P_201, given the pattern from previous mappings

All of this mapping logic is encoded in the GPT prompt. Using an LLM in this way of course comes with risk, as the
rules are less deterministic than custom coded logic for these kinds of mappings, but when used correctly the LLM's ability
to detect patterns in existing mappings could greatly reduce the need for a human to intervene and identify these patterns.
