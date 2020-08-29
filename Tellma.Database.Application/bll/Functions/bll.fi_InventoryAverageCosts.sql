﻿CREATE FUNCTION [bll].[fi_InventoryAverageCosts] (
	@ProcessedWideLines dbo.WideLineList READONLY
)
RETURNS TABLE AS RETURN (
	WITH InventoryAccounts AS (
		SELECT A.[Id], A.[AccountTypeId]
		FROM dbo.Accounts A
		JOIN dbo.AccountTypes ATC ON A.[AccountTypeId] = ATC.[Id]
		JOIN dbo.AccountTypes ATP ON ATC.[Node].IsDescendantOf(ATP.[Node])  = 1
		WHERE ATP.[Concept] = N'Inventories'
		--AND A.[IsActive] = 1 AND ATC.IsActive = 1
	)
-- two assumptions: Resource cannot appear in more than one inventory account. Warehouse determines center.
	SELECT
		PWL.PostingDate, E.[CustodyId] , E.[ResourceId], -- A.[AccountTypeId], E.[CenterId],
		SUM(E.[AlgebraicMonetaryValue]) AS NetMonetaryValue,
		SUM(E.[AlgebraicValue]) AS NetValue,
		SUM(E.[AlgebraicQuantity]) AS NetQuantity
	FROM map.[DetailsEntries]() E
	JOIN dbo.Lines L ON E.[LineId] = L.[Id]
	JOIN @ProcessedWideLines PWL ON PWL.[ResourceId1] = E.[ResourceId] AND PWL.[CustodyId1] = E.[CustodyId] AND L.PostingDate <= PWL.[PostingDate]
	JOIN InventoryAccounts A ON E.[AccountId] = A.[Id]
	WHERE L.[State] = 4
	GROUP BY PWL.PostingDate, E.[CustodyId] , E.[ResourceId]--, A.[AccountTypeId], E.[CenterId]
);