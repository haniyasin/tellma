﻿CREATE PROCEDURE [dal].[AccountClassifications__Save]
	@Entities [AccountClassificationList] READONLY,
	@ReturnIds BIT = 0
AS
SET NOCOUNT ON;
	DECLARE @IndexedIds [dbo].[IndexedIdList];
	DECLARE @Now DATETIMEOFFSET(7) = SYSDATETIMEOFFSET();
	DECLARE @UserId INT = CONVERT(INT, SESSION_CONTEXT(N'UserId'));

	INSERT INTO @IndexedIds([Index], [Id])
	SELECT x.[Index], x.[Id]
	FROM
	(
		MERGE INTO [dbo].[AccountClassifications] AS t
		USING (
			SELECT
				[Index], [Id], [Name], [Name2], [Name3], [Code],
				hierarchyid::Parse('/' + CAST(-ABS(CHECKSUM(NewId()) % 2147483648) AS VARCHAR(30)) + '/') AS [Node]
			FROM @Entities 
		) AS s ON (t.Id = s.Id)
		WHEN MATCHED 
		THEN
			UPDATE SET
				t.[Name]					= s.[Name],
				t.[Name2]					= s.[Name2],
				t.[Name3]					= s.[Name3],
				t.[Code]					= s.[Code],
				t.[ModifiedAt]				= @Now,
				t.[ModifiedById]			= @UserId
		WHEN NOT MATCHED THEN
			INSERT ([Name], [Name2], [Name3], [Code], [Node])
			VALUES (s.[Name], s.[Name2], s.[Name3], s.[Code], s.[Node]
				)
			OUTPUT s.[Index], inserted.[Id]
	) AS x;
	
	WITH DirectParents AS (
		SELECT EC.[Code] AS ChildCode, MAX(EP.Code) AS ParentCode
		FROM dbo.[AccountClassifications] EC
		LEFT JOIN dbo.[AccountClassifications] EP ON EC.[Code] LIKE EP.[Code] +'%' AND EC.[Code] <> EP.[Code]
		GROUP BY EC.[Code]
	),
	Children ([Id], [ParentId], [Num]) AS (
		SELECT EC.[Id], EP.[Id] As ParentId, ROW_NUMBER() OVER (PARTITION BY EP.[Id] ORDER BY EP.[Id], EC.[Code])   
		FROM dbo.[AccountClassifications] EC
		JOIN DirectParents DP ON EC.Code = DP.ChildCode
		LEFT JOIN dbo.[AccountClassifications] EP ON EP.Code = DP.ParentCode
	),
	Paths ([Node], [Id]) AS (  
		-- This section provides the value for the roots of the hierarchy  
		SELECT CAST(('/'  + CAST(C.Num AS VARCHAR(30)) + '/') AS HIERARCHYID) AS [Node], [Id]
		FROM Children AS C   
		WHERE [ParentId] IS NULL
		UNION ALL   
		-- This section provides values for all nodes except the root  
		SELECT CAST(P.[Node].ToString() + CAST(C.Num AS VARCHAR(30)) + '/' AS HIERARCHYID), C.[Id]
		FROM Children C
		JOIN Paths P ON C.[ParentId] = P.[Id]
	)
	MERGE INTO dbo.[AccountClassifications] As t
	USING Paths As s ON (t.[Id] = s.[Id] AND t.[Node] <> s.[Node])
	WHEN MATCHED THEN UPDATE SET t.[Node] = s.[Node];
	----SELECT  *, [Node].ToString() As [Path] FROM @Entities;-- ORDER BY [Node].GetLevel(), [Node];
	
	IF @ReturnIds = 1
		SELECT * FROM @IndexedIds;