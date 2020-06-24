﻿CREATE TABLE [dbo].[Contracts] (
--	These includes all the natural and legal persons with which the business entity may interact
	[Id]						INT					CONSTRAINT [PK_Contracts] PRIMARY KEY IDENTITY,
	[DefinitionId]				INT					NOT NULL	CONSTRAINT [FK_Contracts__DefinitionId] REFERENCES dbo.[ContractDefinitions]([Id]),
								CONSTRAINT [IX_Contracts__Id_DefinitionId] UNIQUE ([Id], [DefinitionId]),
	[Name]						NVARCHAR (255)		NOT NULL, -- CONSTRAINT [IX_Contracts__Name] UNIQUE,
	[Name2]						NVARCHAR (255),
	[Name3]						NVARCHAR (255),
	[Code]						NVARCHAR (50),

	[CurrencyId]				NCHAR (3)			CONSTRAINT [FK_Constracts__CurrencyId] REFERENCES dbo.[Currencies]([Id]),
	[CenterId]					INT					CONSTRAINT [FK_Contracts__CenterId] REFERENCES dbo.[Centers]([Id]),
	[ImageId]					NVARCHAR (50),
	[Description]				NVARCHAR (2048),
	[Description2]				NVARCHAR (2048),
	[Description3]				NVARCHAR (2048),
	[Location]					GEOGRAPHY,
	[LocationJson]				NVARCHAR (MAX),
	[FromDate]					DATE,
	[ToDate]					DATE,
	[Decimal1]					DECIMAL,
	[Decimal2]					DECIMAL,
	[Int1]						INT,
	[Int2]						INT,
	[Lookup1Id]					INT					CONSTRAINT [FK_Constracts__Lookup1Id] REFERENCES [dbo].[Lookups] ([Id]),
	[Lookup2Id]					INT					CONSTRAINT [FK_Constracts__Lookup2Id] REFERENCES [dbo].[Lookups] ([Id]),
	[Lookup3Id]					INT					CONSTRAINT [FK_Constracts__Lookup3Id] REFERENCES [dbo].[Lookups] ([Id]),
	[Lookup4Id]					INT					CONSTRAINT [FK_Constracts__Lookup4Id] REFERENCES [dbo].[Lookups] ([Id]),
	[Text1]						NVARCHAR (50),
	[Text2]						NVARCHAR (50),

	[AgentId]					INT					CONSTRAINT [FK_Constracts__AgentId] REFERENCES [dbo].[Agents] ([Id]),
	[TaxIdentificationNumber]	NVARCHAR (18),
	[JobId]						INT, -- FK to table Jobs
	[BankAccountNumber]			NVARCHAR (34),

	[IsActive]					BIT					NOT NULL DEFAULT 1,
	[CreatedAt]					DATETIMEOFFSET(7)	NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	[CreatedById]				INT					NOT NULL DEFAULT CONVERT(INT, SESSION_CONTEXT(N'UserId')) CONSTRAINT [FK_Contracts__CreatedById] REFERENCES [dbo].[Users] ([Id]),
	[ModifiedAt]				DATETIMEOFFSET(7)	NOT NULL DEFAULT SYSDATETIMEOFFSET(), 
	[ModifiedById]				INT					NOT NULL DEFAULT CONVERT(INT, SESSION_CONTEXT(N'UserId')) CONSTRAINT [FK_Contracts__ModifiedById] REFERENCES [dbo].[Users] ([Id])
);
GO
CREATE UNIQUE NONCLUSTERED INDEX [IX_Contracts__Code]
  ON [dbo].[Contracts]([Code]) WHERE [Code] IS NOT NULL;