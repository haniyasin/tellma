﻿CREATE PROCEDURE [dal].[Reconciliation__Load_Unreconciled]
-- Logic assumes that reconcilation is done on closed documents only.
	@AccountId		INT, 
	@AgentId		INT, 
	@AsOfDate		DATE, 
	@Top			INT, 
	@Skip			INT,
	@TopExternal	INT, 
	@SkipExternal	INT,
	@EntriesBalance						DECIMAL (19,4) OUTPUT,
	@UnreconciledEntriesBalance			DECIMAL (19,4) OUTPUT,
	@UnreconciledExternalEntriesBalance	DECIMAL (19,4) OUTPUT,
	@UnreconciledEntriesCount			INT OUTPUT,
	@UnreconciledExternalEntriesCount	INT OUTPUT
WITH RECOMPILE
AS
	SELECT @EntriesBalance = SUM(E.[Direction] * E.[MonetaryValue])
	FROM dbo.Entries E
	JOIN dbo.Lines L ON L.[Id] = E.[LineId]
	JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
	WHERE E.[AgentId] = @AgentId
	AND E.[AccountId] = @AccountId
	AND L.[State] = 4
	AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
	AND L.[PostingDate] <= @AsOfDate;

	With ReconciledEntriesAsOfDate AS (
		SELECT DISTINCT RE.[EntryId]
		FROM dbo.ReconciliationEntries RE
		JOIN dbo.Reconciliations R ON RE.ReconciliationId = R.Id
		JOIN dbo.ReconciliationExternalEntries REE ON REE.ReconciliationId = R.Id
		JOIN dbo.ExternalEntries EE ON REE.ExternalEntryId = EE.Id
		WHERE EE.PostingDate <=  @AsOfDate	
		AND EE.[AccountId] = @AccountId
		AND EE.[AgentId] = @AgentId
	),
	WhollyReversedEntriesAsOfDate AS (
		SELECT DISTINCT RE.[ReconciliationId]
		FROM dbo.ReconciliationEntries RE
		JOIN dbo.Entries E ON RE.EntryId = E.[Id]
		JOIN dbo.Lines L ON L.[Id] = E.[LineId]
		JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
		WHERE L.PostingDate <= @AsOfDate
		AND L.[State] = 4
		AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
		AND	E.[AccountId] = @AccountId
		AND E.[AgentId] = @AgentId
		AND RE.ReconciliationId NOT IN (SELECT ReconciliationId FROM dbo.ReconciliationExternalEntries)
		EXCEPT
		SELECT DISTINCT RE.[ReconciliationId]
		FROM dbo.ReconciliationEntries RE
		JOIN dbo.Entries E ON RE.EntryId = E.[Id]
		JOIN dbo.Lines L ON L.[Id] = E.[LineId]
		JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
		WHERE L.PostingDate > @AsOfDate
		AND L.[State] = 4
		AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
		AND	E.[AccountId] = @AccountId
		AND E.[AgentId] = @AgentId
	)
	SELECT
		@UnreconciledEntriesCount = COUNT(*),
		@UnreconciledEntriesBalance = SUM(E.[Direction] * E.[MonetaryValue])
	FROM dbo.Entries E
	JOIN dbo.Lines L ON L.[Id] = E.[LineId]
	JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
	WHERE E.[AgentId] = @AgentId
	AND E.[AccountId] = @AccountId
	AND L.[State] = 4
	AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
	AND	L.[PostingDate] <= @AsOfDate
	-- Exclude if it was reconciled with an external entry before AsOfDate
	AND E.[Id] NOT IN (SELECT EntryId FROM ReconciledEntriesAsOfDate)
	-- Exclude if it was reversed with an internal entry before AsOfDate
	AND E.[Id] NOT IN (
		SELECT EntryId FROM dbo.ReconciliationEntries 
		WHERE ReconciliationId IN (SELECT [ReconciliationId] FROM WhollyReversedEntriesAsOfDate)
	);

	With ReconciledExternalEntriesAsOfDate AS (
		SELECT DISTINCT REE.[ExternalEntryId]
		FROM dbo.ReconciliationExternalEntries REE
		JOIN dbo.Reconciliations R ON REE.ReconciliationId = R.Id
		JOIN dbo.ReconciliationEntries RE ON RE.ReconciliationId = R.Id
		JOIN dbo.Entries E ON RE.EntryId = E.Id
		JOIN dbo.Lines L ON L.[Id] = E.[LineId]
		JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
		WHERE L.PostingDate <=  @AsOfDate
		AND L.[State] = 4
		AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
		AND E.[AccountId] = @AccountId
		AND E.[AgentId] = @AgentId
	),
	WhollyReversedExternalEntriesAsOfDate AS (
		SELECT DISTINCT REE.[ReconciliationId]
		FROM dbo.ReconciliationExternalEntries REE
		JOIN dbo.ExternalEntries EE ON REE.ExternalEntryId = EE.[Id]
		WHERE EE.PostingDate <= @AsOfDate
		AND	EE.[AccountId] = @AccountId
		AND EE.[AgentId] = @AgentId
		AND REE.ReconciliationId NOT IN (SELECT ReconciliationId FROM dbo.ReconciliationEntries)
		EXCEPT
		SELECT DISTINCT REE.[ReconciliationId]
		FROM dbo.ReconciliationExternalEntries REE
		JOIN dbo.ExternalEntries EE ON REE.ExternalEntryId = EE.[Id]
		WHERE EE.PostingDate > @AsOfDate
		AND	EE.[AccountId] = @AccountId
		AND EE.[AgentId] = @AgentId
	)
	SELECT
		@UnreconciledExternalEntriesCount = COUNT(*),
		@UnreconciledExternalEntriesBalance = SUM(EE.[Direction] * EE.[MonetaryValue])
	FROM dbo.ExternalEntries EE
	WHERE EE.[AgentId] = @AgentId
	AND EE.[AccountId] = @AccountId
	AND	EE.[PostingDate] <= @AsOfDate
	AND EE.[Id] NOT IN (SELECT [ExternalEntryId] FROM ReconciledExternalEntriesAsOfDate)
	AND EE.[Id] NOT IN (
		SELECT ExternalEntryId FROM dbo.ReconciliationExternalEntries 
		WHERE ReconciliationId IN (SELECT [ReconciliationId] FROM WhollyReversedExternalEntriesAsOfDate)
	);
	
	With ReconciledEntriesAsOfDate AS (
		SELECT DISTINCT RE.[EntryId]
		FROM dbo.ReconciliationEntries RE
		JOIN dbo.Reconciliations R ON RE.ReconciliationId = R.Id
		JOIN dbo.ReconciliationExternalEntries REE ON REE.ReconciliationId = R.Id
		JOIN dbo.ExternalEntries EE ON REE.ExternalEntryId = EE.Id
		WHERE EE.PostingDate <=  @AsOfDate	
		AND EE.[AccountId] = @AccountId
		AND EE.[AgentId] = @AgentId
	),
	WhollyReversedEntriesAsOfDate AS (
		SELECT DISTINCT RE.[ReconciliationId]
		FROM dbo.ReconciliationEntries RE
		JOIN dbo.Entries E ON RE.EntryId = E.[Id]
		JOIN dbo.Lines L ON L.[Id] = E.[LineId]
		JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
		WHERE L.PostingDate <= @AsOfDate
		AND L.[State] = 4
		AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
		AND	E.[AccountId] = @AccountId
		AND E.[AgentId] = @AgentId
		AND RE.ReconciliationId NOT IN (SELECT ReconciliationId FROM dbo.ReconciliationExternalEntries)
		EXCEPT
		SELECT DISTINCT RE.[ReconciliationId]
		FROM dbo.ReconciliationEntries RE
		JOIN dbo.Entries E ON RE.EntryId = E.[Id]
		JOIN dbo.Lines L ON L.[Id] = E.[LineId]
		JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
		WHERE L.PostingDate > @AsOfDate
		AND L.[State] = 4
		AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
		AND	E.[AccountId] = @AccountId
		AND E.[AgentId] = @AgentId
	)
	SELECT E.[Id], L.[PostingDate], E.[Direction], E.[MonetaryValue],
		--IIF([Direction] = 1, E.[NotedAgentName], E.[InternalReference]) AS ExternalReference,
		IIF([Direction] = 1,
			COALESCE(E.[ExternalReference], E.[InternalReference], E.[NotedAgentName]),
			COALESCE(E.[InternalReference], E.[ExternalReference], E.[NotedAgentName])
		) AS ExternalReference,
		L.[DocumentId], D.[DefinitionId] AS [DocumentDefinitionId], D.[SerialNumber] AS [DocumentSerialNumber],
			CAST(IIF(E.[Id] IN (SELECT [EntryId] FROM dbo.ReconciliationEntries), 1, 0) AS BIT) AS IsReconciledLater
	FROM dbo.Entries E
	JOIN dbo.Lines L ON E.[LineId] = L.[Id]
	JOIN map.Documents() D ON L.[DocumentId] = D.[Id]
	WHERE E.[AgentId] = @AgentId
	AND E.[AccountId] = @AccountId
	AND L.[State] = 4
	AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
	AND L.[PostingDate] <= @AsOfDate
	-- Exclude if it was reconciled with an external entry before AsOfDate
	AND E.[Id] NOT IN (SELECT EntryId FROM ReconciledEntriesAsOfDate)
	-- Exclude if it was reversed with an internal entry before AsOfDate
	AND E.[Id] NOT IN (
			SELECT EntryId FROM dbo.ReconciliationEntries 
			WHERE ReconciliationId IN (SELECT [ReconciliationId] FROM WhollyReversedEntriesAsOfDate)
	)
	ORDER BY L.[PostingDate], D.[Code], E.[MonetaryValue], E.[ExternalReference]
	OFFSET (@Skip) ROWS FETCH NEXT (@Top) ROWS ONLY;

	With ReconciledExternalEntriesAsOfDate AS (
		SELECT DISTINCT REE.[ExternalEntryId]
		FROM dbo.ReconciliationExternalEntries REE
		JOIN dbo.Reconciliations R ON REE.ReconciliationId = R.Id
		JOIN dbo.ReconciliationEntries RE ON RE.ReconciliationId = R.Id
		JOIN dbo.Entries E ON RE.EntryId = E.Id
		JOIN dbo.Lines L ON L.[Id] = E.[LineId]
		JOIN dbo.Documents D ON D.[Id] = L.[DocumentId] -- MA: 2024-02-05
		WHERE L.PostingDate <=  @AsOfDate
		AND L.[State] = 4
		AND D.[State] = 1 -- MA: 2024-02-05 to avoid signatures issue
		AND E.[AccountId] = @AccountId
		AND E.[AgentId] = @AgentId
	),
	WhollyReversedExternalEntriesAsOfDate AS (
		SELECT DISTINCT REE.[ReconciliationId]
		FROM dbo.ReconciliationExternalEntries REE
		JOIN dbo.ExternalEntries EE ON REE.ExternalEntryId = EE.[Id]
		WHERE EE.PostingDate <= @AsOfDate
		AND	EE.[AccountId] = @AccountId
		AND EE.[AgentId] = @AgentId
		AND REE.ReconciliationId NOT IN (SELECT ReconciliationId FROM dbo.ReconciliationEntries)
		EXCEPT
		SELECT DISTINCT REE.[ReconciliationId]
		FROM dbo.ReconciliationExternalEntries REE
		JOIN dbo.ExternalEntries EE ON REE.ExternalEntryId = EE.[Id]
		WHERE EE.PostingDate > @AsOfDate
		AND	EE.[AccountId] = @AccountId
		AND EE.[AgentId] = @AgentId
	)
	SELECT EE.[Id], EE.[PostingDate], EE.[Direction], EE.[MonetaryValue],
		EE.[ExternalReference],
		EE.[CreatedById], EE.[CreatedAt], EE.[ModifiedById], EE.[ModifiedAt],
		CAST(IIF(EE.[Id] IN (SELECT [ExternalEntryId] FROM dbo.ReconciliationExternalEntries), 1, 0) AS BIT) AS IsReconciledLater
	FROM dbo.ExternalEntries EE
	WHERE EE.[AgentId] = @AgentId
	AND EE.[AccountId] = @AccountId
	AND EE.[AccountId] = @AccountId
	AND	EE.[PostingDate] <= @AsOfDate
	-- Exclude if it was reconciled with internal entry before as of date
	AND EE.[Id] NOT IN (SELECT [ExternalEntryId] FROM ReconciledExternalEntriesAsOfDate)
	-- exclude if it was reconciled with external 
	AND EE.[Id] NOT IN (
		SELECT ExternalEntryId FROM dbo.ReconciliationExternalEntries 
		WHERE ReconciliationId IN (SELECT [ReconciliationId] FROM WhollyReversedExternalEntriesAsOfDate)
	)
	ORDER BY EE.[PostingDate], EE.[MonetaryValue], EE.[ExternalReference]
	OFFSET (@SkipExternal) ROWS FETCH NEXT (@TopExternal) ROWS ONLY;