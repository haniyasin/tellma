﻿CREATE TABLE [dbo].[AccountTypes] ( -- inspired by IfrsConcepts. However, its main purpose is to facilitate smart posting
	[Id]					NVARCHAR (255)		PRIMARY KEY NONCLUSTERED,
	[IsAssignable]			BIT					NOT NULL DEFAULT 1,
	[Name]					NVARCHAR (255)		NOT NULL,
	[Name2]					NVARCHAR (255),
	[Name3]					NVARCHAR (255),
	-- Additional properties, Is Active at the end
	[IsActive]				BIT					NOT NULL DEFAULT 1,
	-- Pure SQL properties and computed properties
	[Node]					HIERARCHYID			NOT NULL,
	[ParentNode]			AS [Node].GetAncestor(1),
);
GO
CREATE UNIQUE CLUSTERED INDEX [IX_AccountTypes__Node]
	ON [dbo].[AccountTypes]([Node]);
GO