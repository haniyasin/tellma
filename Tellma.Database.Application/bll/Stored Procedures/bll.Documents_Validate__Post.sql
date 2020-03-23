﻿CREATE PROCEDURE [bll].[Documents_Validate__Post]
	@DefinitionId NVARCHAR(50),
	@Ids [dbo].[IndexedIdList] READONLY,
	@Top INT = 10
AS
SET NOCOUNT ON;
	DECLARE @ValidationErrors [dbo].[ValidationErrorList], @UserId INT = CONVERT(INT, SESSION_CONTEXT(N'UserId'));
	DECLARE @WflessLines LineList, @WflessEntries EntryList, @ArchiveDate DATE;
	
	-- Posting Date not null
	INSERT INTO @ValidationErrors([Key], [ErrorName])
	SELECT TOP (@Top)
		'[' + CAST([Index] AS NVARCHAR (255)) + ']',
		N'Error_DocumentPostingDateIsRequired'
	FROM @Ids FE
	JOIN dbo.Documents D ON FE.[Id] = D.[Id]
	WHERE D.[PostingDate] IS NULL;

	-- Posting  Date not before last archive date
	SELECT @ArchiveDate = [ArchiveDate] FROM dbo.Settings;
	INSERT INTO @ValidationErrors([Key], [ErrorName])
	SELECT TOP (@Top)
		'[' + CAST([Index] AS NVARCHAR (255)) + ']',
		N'Error_DocumentPostingDateMustBeAfterArchiveDate'
	FROM @Ids FE
	JOIN dbo.Documents D ON FE.[Id] = D.[Id]
	WHERE D.[PostingDate] <= @ArchiveDate;

	-- Cannot post it if it is not draft
	INSERT INTO @ValidationErrors([Key], [ErrorName])
	SELECT TOP (@Top)
		'[' + CAST([Index] AS NVARCHAR (255)) + ']',
		N'Error_DocumentIsNotDraft'
	FROM @Ids FE
	JOIN dbo.Documents D ON FE.[Id] = D.[Id]
	WHERE D.[PostingState] <> 0;
	-- Cannot post a document which does not have at lease one line that is (Finalized)
	INSERT INTO @ValidationErrors([Key], [ErrorName])
	SELECT TOP (@Top)
		'[' + CAST([Index] AS NVARCHAR (255)) + ']',
		N'Error_TheDocumentDoesNotHaveAnyFinalizedLines'
	FROM @Ids 
	WHERE [Id] NOT IN (
		SELECT DISTINCT [DocumentId] 
		FROM dbo.[Lines] L
		JOIN map.[LineDefinitions]() LD ON L.[DefinitionId] = LD.[Id]
		WHERE
			LD.[HasWorkflow] = 1 AND L.[State] = 4
		OR	LD.[HasWorkflow] = 0 AND L.[State] = 0
	);

	-- All workflow lines must be in their final states or Wfless Draft.
	INSERT INTO @ValidationErrors([Key], [ErrorName])
	SELECT TOP (@Top)
		'[' + CAST(D.[Index] AS NVARCHAR (255)) + '].Lines[' +
			CAST(L.[Index] AS NVARCHAR (255)) + ']',
		N'Error_LineIsMissingSignatures'
	FROM @Ids D
	JOIN dbo.[Lines] L ON L.[DocumentId] = D.[Id]
	JOIN map.LineDefinitions() LD ON L.[DefinitionId] = LD.[Id]
	WHERE L.[State] Between 0 AND 3
	AND LD.[HasWorkflow] = 1
	-- validate that WflessLines can move to state 4
	INSERT INTO @WflessLines([Index], [DocumentIndex], [Id], [DefinitionId], [Memo])
	SELECT L.[Index], L.[DocumentId], L.[Id], L.[DefinitionId], L.[Memo]
	FROM dbo.Lines L
	JOIN map.LineDefinitions() LD ON L.[DefinitionId] = LD.[Id]
	WHERE L.[DocumentId] IN (SELECT [ID] FROM @Ids) 
	AND LD.HasWorkflow = 0;
	INSERT INTO @WflessEntries ([Index],[LineIndex],[DocumentIndex],[Id],
	[Direction],[AccountId],[CurrencyId],[AgentId],[ResourceId],[CenterId],
	[EntryTypeId],[DueDate],[MonetaryValue],[Quantity],[UnitId],[Value],[Time1],
	[Time2]	,[ExternalReference],[AdditionalReference],[NotedAgentId],[NotedAgentName],
	[NotedAmount],[NotedDate])
	SELECT E.[Index],L.[Index],L.[DocumentId],E.[Id],
	E.[Direction],E.[AccountId],E.[CurrencyId],E.[AgentId],E.[ResourceId],E.[CenterId],
	E.[EntryTypeId],E.[DueDate],E.[MonetaryValue],E.[Quantity],E.[UnitId],E.[Value],E.[Time1],
	E.[Time2]	,E.[ExternalReference],E.[AdditionalReference],E.[NotedAgentId],E.[NotedAgentName],
	E.[NotedAmount],E.[NotedDate]
	FROM dbo.Entries E
	JOIN dbo.Lines L ON E.[LineId] = L.[Id];
	INSERT INTO @ValidationErrors
	EXEC [bll].[Lines_Validate__State_Update]
	@Lines = @WflessLines, @Entries = @WflessEntries, @ToState = 4;
	-- Cannot post a document with non-balanced lines (finalized or draft Wfless)
	INSERT INTO @ValidationErrors([Key], [ErrorName], [Argument0])
	SELECT TOP (@Top)
		'[' + ISNULL(CAST(FE.[Index] AS NVARCHAR (255)),'') + ']', 
		N'Error_TransactionHasDebitCreditDifference0',
		FORMAT(SUM(E.[Direction] * E.[Value]), '##,#;(##,#);-', 'en-us') AS NetDifference
	FROM @Ids FE
	JOIN dbo.[Lines] L ON FE.[Id] = L.[DocumentId]
	JOIN map.[LineDefinitions]() LD ON L.[DefinitionId] = LD.[Id]
	JOIN dbo.[Entries] E ON L.[Id] = E.[LineId]
	WHERE
		LD.[HasWorkflow] = 1 AND L.[State] = 4
	OR	LD.[HasWorkflow] = 0 AND L.[State] = 0
	GROUP BY FE.[Index]
	HAVING SUM(E.[Direction] * E.[Value]) <> 0;

	SELECT TOP (@Top) * FROM @ValidationErrors;