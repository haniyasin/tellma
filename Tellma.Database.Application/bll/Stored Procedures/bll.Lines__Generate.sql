﻿CREATE PROCEDURE [bll].[Lines__Generate]
	@LineDefinitionId INT,
	@GenerateArguments [GenerateArgumentList] READONLY
AS
	SET NOCOUNT ON;
	DECLARE @Script NVARCHAR (MAX);
	DECLARE @WideLines WideLineList;
	DECLARE @Lines LineList, @Entries EntryList;
	SELECT @Script = [GenerateScript] FROM dbo.LineDefinitions WHERE [Id] = @LineDefinitionId;

	INSERT INTO @WideLines
	EXECUTE	sp_executesql @Script, N'@GenerateArguments [GenerateArgumentList] READONLY',
			@GenerateArguments = @GenerateArguments;

	INSERT INTO @Lines([Index], [DefinitionId], [PostingDate], [Memo])
	SELECT [Index], @LineDefinitionId, [PostingDate], [Memo] FROM @WideLines

	INSERT INTO @Entries
	EXEC [bll].[WideLines__Unpivot] @WideLines;

	SELECT
		[L].[DefinitionId],
		[L].[PostingDate],
		--[L].[TemplateLineId],
		--[L].[Multiplier],
		[L].[Memo],
		[L].[Index]
	FROM @Lines AS [L] -- LineList
	ORDER BY [L].[Index] ASC

	SELECT
	[E].[AccountId],
	[E].[CurrencyId],
	[E].[ResourceId],
	[E].[ContractId],
	[E].[EntryTypeId],
	[E].[NotedContractId],
	[E].[CenterId],
	[E].[UnitId],
	[E].[IsSystem],
	[E].[Direction],
	[E].[DueDate],
	[E].[MonetaryValue],
	[E].[Quantity],
	[E].[Value],
	[E].[Time1],
	[E].[Time2],
	[E].[ExternalReference],
	[E].[AdditionalReference],
	[E].[NotedAgentName],
	[E].[NotedAmount],
	[E].[NotedDate],
	[E].[LineIndex]
	FROM @Entries AS [E]
	ORDER BY [E].[Index] ASC
	
	-- Accounts
	SELECT 
	[A].[Id], 
	[A].[Name], 
	[A].[Name2], 
	[A].[Name3], 
	[A].[Code] 
	FROM [map].[Accounts]() [A] 
	WHERE [Id] IN (SELECT [AccountId] FROM @Entries)

	-- Currency
	SELECT 
	[C].[Id], 
	[C].[Name],
	[C].[Name2], 
	[C].[Name3], 
	[C].[E] FROM 
	[map].[Currencies]() [C] 
	WHERE [Id] IN (SELECT [CurrencyId] FROM @Entries)

	-- Resource
	SELECT 
	[R].[Id], 
	[R].[Name], 
	[R].[Name2], 
	[R].[Name3], 
	[R].[DefinitionId] 
	FROM [map].[Resources]() [R] 
	WHERE [Id] IN (SELECT [ResourceId] FROM @Entries)

	-- Contract
	SELECT 
	[C].[Id], 
	[C].[Name],
	[C].[Name2],
	[C].[Name3],
	[C].[DefinitionId]
	FROM [map].[Contracts]() [C] 
	WHERE [Id] IN (SELECT [ContractId] FROM @Entries UNION SELECT [NotedContractId] FROM @Entries)

	-- EntryType
	SELECT 
	[ET].[Id],
	[ET].[Name], 
	[ET].[Name2], 
	[ET].[Name3]
	FROM [map].[EntryTypes]() [ET]
	WHERE [Id] IN (SELECT [EntryTypeId] FROM @Entries)
	
	-- Center
	SELECT 
	[C].[Id], 
	[C].[Name], 
	[C].[Name2], 
	[C].[Name3] 
	FROM [map].[Centers]() [C] 
	WHERE [Id] IN (SELECT [CenterId] FROM @Entries)

	-- Unit
	SELECT 
	[U].[Id], 
	[U].[Name], 
	[U].[Name2], 
	[U].[Name3] 
	FROM [map].[Units]() [U] 
	WHERE [Id] IN (SELECT [UnitId] FROM @Entries)
