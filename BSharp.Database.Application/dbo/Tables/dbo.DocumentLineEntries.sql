﻿CREATE TABLE [dbo].[DocumentLineEntries] (
--	These are for transactions only. If there are entries from requests or inquiries, etc=> other tables
	[Id]						INT				CONSTRAINT [PK_DocumentLineEntries] PRIMARY KEY IDENTITY,
	[DocumentLineId]			INT				NOT NULL CONSTRAINT [FK_DocumentLineEntries__DocumentLineId] FOREIGN KEY ([DocumentLineId])	REFERENCES [dbo].[DocumentLines] ([Id]) ON DELETE CASCADE,
	[EntryNumber]				INT				NOT NULL DEFAULT 1,
--	Upon posting the document, the auto generated entries will be MERGED with the present ones
--	based on AccountId, IfrsAccountId, IfrsEntryClassificationId, ResourceId
--	to minimize Transaction Entries deletions
--	It will be presented ORDER BY Direction DESC, AccountId.Code, IfrsAccountId.Node, IfrsEntryClassificationId.Node
	[Direction]					SMALLINT		NOT NULL CONSTRAINT [CK_DocumentLineEntries__Direction]	CHECK ([Direction] IN (-1, 1)),
 -- Account selection enforces additional filters on the other columns
	[AccountId]					INT				NOT NULL CONSTRAINT [FK_DocumentLineEntries__Accounts]	FOREIGN KEY ([AccountId]) REFERENCES [dbo].[Accounts] ([Id]),
-- Analysis of accounts including: cash, non current assets, equity, and expenses. Can be updated after posting
	-- Note that the responsibility center might define the Ifrs Note
	[IfrsEntryClassificationId]	NVARCHAR (255)	CONSTRAINT [FK_DocumentLineEntries__IfrsEntryClassifications] FOREIGN KEY ([IfrsEntryClassificationId]) REFERENCES [dbo].[IfrsEntryClassifications] ([Id]),	
	[AgentId]					INT				CONSTRAINT [FK_DocumentLineEntries__AgentId] FOREIGN KEY ([AgentId])	REFERENCES [dbo].[Resources] ([Id]),
	[ResponsibilityCenterId]	INT				CONSTRAINT [FK_DocumentLineEntries__ResponsibilityCenterId] FOREIGN KEY ([ResponsibilityCenterId])	REFERENCES [dbo].[Resources] ([Id]),
-- Resource is defined as
--	The actual asset, liability
--	The good/service sold for revenues and direct expenses
--	The good/service consumed for indirect expenses
--  TODO: Make a composite foreign key to table ResourcePicks using ResourceId and ResourcePickId
	[ResourceId]				INT				CONSTRAINT [FK_DocumentLineEntries__ResourceId] FOREIGN KEY ([ResourceId])	REFERENCES [dbo].[Resources] ([Id]),
--	steel rolls:coil #, car:VIN, merchandise:EPC, check:BankCode+AccNumber+CheckNumber.
--	AVCO is run either at the resource level or at the number level (specified costing)
	[ResourcePickId]			INT				CONSTRAINT [FK_DocumentLineEntries__ResourcePickId] FOREIGN KEY ([ResourcePickId]) REFERENCES [dbo].[ResourcePicks] ([Id]),
--  Used for tracking of raw materials, production supplies, and finished goods.
--	We always show the non zero balances per triplet (ResourceId, InstanceId, BatchCode)
--	Manufacturing and expiry date apply to the composite pair (ResourceId and BatchCode)
	[BatchCode]					NVARCHAR (255),
	[DueDate]					DATE, -- applies to temporary accounts, such as loans and borrowings
-- Tracking additive measures, the data type is to be decided by AA
	[Quantity]					VTYPE			NOT NULL DEFAULT 0, -- measure on which the value is based.
	[MonetaryValue]				MONEY			NOT NULL DEFAULT 0, -- Amount in foreign Currency 
	[Mass]						DECIMAL (18,2)	NOT NULL DEFAULT 0, -- MassUnit, like LTZ bar, cement bag, etc
	[Volume]					DECIMAL (18,2)	NOT NULL DEFAULT 0, -- VolumeUnit, possibly for shipping
	[Area]						DECIMAL (18,2)	NOT NULL DEFAULT 0, -- Area Unit, possibly for lands
	[Length]					DECIMAL (18,2)	NOT NULL DEFAULT 0, -- Length Unit, possibly for cables or pipes
	[Time]						DECIMAL (18,2)	NOT NULL DEFAULT 0, -- ServiceTimeUnit
	[Count]						DECIMAL (18,2)	NOT NULL DEFAULT 0, -- CountUnit
	[Value]						VTYPE			NOT NULL DEFAULT 0, -- equivalent in functional currency
-- Additional information to satisfy reporting requirements
	[Memo]						NVARCHAR (255), -- a textual description for statements and reports
-- While Voucher Number referes to the source document, this refers to any other identifying string 
-- for support documents, such as deposit slip reference, invoice number, etc...
	[ExternalReference]			NVARCHAR (255),
-- The following are sort of dynamic properties that capture information for reporting purposes
	[AdditionalReference]		NVARCHAR (255),
-- for debiting asset accounts, related resource is the good/service acquired from supplier/customer/storage
-- for crediting asset accounts, related resource is the good/service delivered to supplier/customer/storage as resource
-- for debiting VAT purchase account, related resource is the good/service purchased
-- for crediting VAT Sales account, related resource is the good/service sold
-- for crediting VAT purchase, debiting VAT sales, or liability account: related resource is N/A
	[RelatedResourceId]			INT, -- Good, Service, Labor, Machine usage
-- The related account is the implicit  account that had two entries, one debiting and one crediting and hence removed
-- Examples include supplier account in cash purchase, customer account in cash sales, employee account in cash payroll, 
-- supplier account in VAT purchase entry, customer account in VAT sales entry, and WIP account in direct production.
	[RelatedAccountId]			INT,
	[RelatedQuantity]			MONEY ,		-- used in Tax accounts, to store the quantiy of taxable item
	[RelatedMoneyAmount]		MONEY 			NOT NULL DEFAULT 0, -- e.g., amount subject to tax
	--[SortKey]					DECIMAL (9,4),
-- for auditing
	[CreatedAt]					DATETIMEOFFSET(7)NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	[CreatedById]				INT				NOT NULL DEFAULT CONVERT(INT, SESSION_CONTEXT(N'UserId')) CONSTRAINT [FK_DocumentLineEntries__CreatedById] FOREIGN KEY ([CreatedById])	REFERENCES [dbo].[Users] ([Id]),
	[ModifiedAt]				DATETIMEOFFSET(7)NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	[ModifiedById]				INT				NOT NULL DEFAULT CONVERT(INT, SESSION_CONTEXT(N'UserId')) CONSTRAINT [FK_DocumentLineEntries__ModifiedById] FOREIGN KEY ([ModifiedById])REFERENCES [dbo].[Users] ([Id]),	
);
GO
CREATE INDEX [IX_DocumentLineEntries__DocumentId] ON [dbo].[DocumentLineEntries]([DocumentLineId]);
GO
CREATE INDEX [IX_DocumentLineEntries__AccountId] ON [dbo].[DocumentLineEntries]([AccountId]);
GO
CREATE INDEX [IX_DocumentLineEntries__IfrsEntryClassificationId] ON [dbo].[DocumentLineEntries]([IfrsEntryClassificationId]);
GO