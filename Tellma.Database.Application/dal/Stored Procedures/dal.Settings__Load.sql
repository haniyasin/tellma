﻿-- Returns all the permissions of the current user
CREATE PROCEDURE [dal].[Settings__Load]
AS
	-- Whether centers are multiple or singleton 
	DECLARE @SegmentCount INT = (SELECT COUNT(*) FROM [dbo].[Centers] WHERE [CenterType] = N'Segment' AND [IsActive] = 1);
	SELECT CAST(IIF(@SegmentCount <> 1, 1, 0) AS BIT) As [IsMultiSegment];

	-- The settings
	SELECT [S].* FROM [dbo].[Settings] AS [S]

	-- The functional currency
	SELECT [C].* FROM [dbo].[Currencies] AS [C] 
	JOIN [dbo].[Settings] AS [S] ON [C].[Id] = [S].[FunctionalCurrencyId]
