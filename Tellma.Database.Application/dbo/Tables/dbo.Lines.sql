﻿CREATE TABLE [dbo].[Lines] (
--	These are for transactions only. If there are Lines from requests or inquiries, etc=> other tables
	[Id]						INT					CONSTRAINT [PK_Lines] PRIMARY KEY IDENTITY,
	[DocumentId]				INT					NOT NULL CONSTRAINT [FK_Lines__DocumentId] REFERENCES [dbo].[Documents] ([Id]) ON DELETE CASCADE,
	[DefinitionId]				INT					NOT NULL CONSTRAINT [FK_Lines__DefinitionId] REFERENCES [dbo].[LineDefinitions] ([Id]),
	[State]						SMALLINT			NOT NULL DEFAULT 0 CONSTRAINT [CK_Lines__State] CHECK ([State] BETWEEN -4 AND +4),
	[PostingDate]				DATE				CONSTRAINT [CK_Lines__PostingDate] CHECK ([PostingDate] < DATEADD(DAY, 1, GETDATE())),
	CONSTRAINT [CK_Lines__State_PostingDate] CHECK([State] < 4 OR [PostingDate] IS NOT NULL),
	--[ContractId]				INT					CONSTRAINT [FK_Lines__ContractId] REFERENCES dbo.Contracts([Id]),
	--[ResourceId]				INT					CONSTRAINT [FK_Lines__ResourceId] REFERENCES dbo.Resources([Id]),
	[TemplateLineId]			INT					CONSTRAINT [FK_Lines__TemplateId] REFERENCES dbo.Lines([Id]),
	[Multiplier]				DECIMAL (19,4),
	CONSTRAINT [CK_Lines__TemplateLineId_Multiplier] CHECK (
		[TemplateLineId] IS NULL AND [Multiplier] IS NULL OR
		[TemplateLineId] IS NOT NULL AND [Multiplier] IS NOT NULL
	),
	--[CurrencyId]				NCHAR (3)			CONSTRAINT [FK_Lines__CurrencyId] REFERENCES dbo.Currencies([Id]),
	--[MonetaryValue]			DECIMAL (19,4),--			NOT NULL DEFAULT 0,
	--[Value]					DECIMAL (19,4),--	NOT NULL DEFAULT 0, -- equivalent in functional currency
	[Memo]						NVARCHAR (255), -- a textual description for statements and reports
	[Index]						INT				NOT NULL,
-- for auditing
	[CreatedAt]				DATETIMEOFFSET(7)	NOT NULL DEFAULT SYSDATETIMEOFFSET() CONSTRAINT [FK_Lines__CreatedById]	FOREIGN KEY ([CreatedById])	REFERENCES [dbo].[Users] ([Id]),
	[CreatedById]			INT	NOT NULL DEFAULT CONVERT(INT, SESSION_CONTEXT(N'UserId')),
	[ModifiedAt]			DATETIMEOFFSET(7)	NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	[ModifiedById]			INT	NOT NULL DEFAULT CONVERT(INT, SESSION_CONTEXT(N'UserId')) CONSTRAINT [FK_Lines__ModifiedById] FOREIGN KEY ([ModifiedById]) REFERENCES [dbo].[Users] ([Id]),
);
GO
CREATE INDEX [IX_Lines__DocumentId] ON [dbo].[Lines]([DocumentId]);
GO