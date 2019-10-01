﻿CREATE TABLE [dbo].[AccountsDisclosures] (
	-- For Trial balance reporting based on a custom classification
	[AccountTypeId]					NVARCHAR (255),
	[IfrsDisclosureId]				NVARCHAR (255), -- StatementOf___Abstract and disclosure notes from 800500
	[Concept]						NVARCHAR (255) NOT NULL, -- the taxonomy defines whether to use instant or period.
	CONSTRAINT [PK_AccountsDisclosures] PRIMARY KEY ([AccountTypeId], [IfrsDisclosureId]),
);