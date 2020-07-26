﻿CREATE PROCEDURE [dal].[Relations__Save]
	@DefinitionId INT,
	@Entities [RelationList] READONLY,
	@RelationUsers dbo.[RelationUserList] READONLY,
	@ImageIds [IndexedImageIdList] READONLY, -- Index, ImageId
	@ReturnIds BIT = 0
AS
BEGIN
SET NOCOUNT ON;
	DECLARE @IndexedIds [dbo].[IndexedIdList];
	DECLARE @Now DATETIMEOFFSET(7) = SYSDATETIMEOFFSET();
	DECLARE @UserId INT = CONVERT(INT, SESSION_CONTEXT(N'UserId'));

	INSERT INTO @IndexedIds([Index], [Id])
	SELECT x.[Index], x.[Id]
	FROM
	(
		MERGE INTO [dbo].[Relations] AS t
		USING (
			SELECT [Index], [Id], --[OperatingSegmentId],
				@DefinitionId AS [DefinitionId],
				[Name], 
				[Name2], 
				[Name3],
				[Code],
				[CurrencyId],
				[CenterId],
				[Description],
				[Description2],
				[Description3],
				geography::STGeomFromWKB([LocationWkb], 4326) AS [Location], -- 4326 = World Geodetic System, used by Google Maps
				[LocationJson],
				[FromDate],
				[ToDate],
				[Decimal1],
				[Decimal2],
				[Int1],
				[Int2],
				[Lookup1Id],
				[Lookup2Id],
				[Lookup3Id],
				[Lookup4Id],
				[Text1],					
				[Text2],
				[AgentId],
				[TaxIdentificationNumber],
				[JobId],
				[BankAccountNumber]
			FROM @Entities 
		) AS s ON (t.Id = s.Id)
		WHEN MATCHED
		THEN
			UPDATE SET
				t.[DefinitionId]			= s.[DefinitionId],
				t.[Name]					= s.[Name],
				t.[Name2]					= s.[Name2],
				t.[Name3]					= s.[Name3],
				
				t.[Code]					= s.[Code],
				t.[CurrencyId]				= s.[CurrencyId],
				t.[CenterId]				= s.[CenterId],
				t.[Description]				= s.[Description],
				t.[Description2]			= s.[Description2],
				t.[Description3]			= s.[Description3],
				t.[Location]				= s.[Location],
				t.[LocationJson]			= s.[LocationJson],
				t.[FromDate]				= s.[FromDate],
				t.[ToDate]					= s.[ToDate],
				t.[Decimal1]				= s.[Decimal1],
				t.[Decimal2]				= s.[Decimal2],
				t.[Int1]					= s.[Int1],
				t.[Int2]					= s.[Int2],
				t.[Lookup1Id]				= s.[Lookup1Id],
				t.[Lookup2Id]				= s.[Lookup2Id],
				t.[Lookup3Id]				= s.[Lookup3Id],
				t.[Lookup4Id]				= s.[Lookup4Id],
				t.[Text1]					= s.[Text1],	
				t.[Text2]					= s.[Text2],

				t.[AgentId]					= s.[AgentId],
				t.[TaxIdentificationNumber] = s.[TaxIdentificationNumber],
				t.[JobId]					= s.[JobId],
				t.[BankAccountNumber]		= s.[BankAccountNumber],

				t.[ModifiedAt]				= @Now,
				t.[ModifiedById]			= @UserId
		WHEN NOT MATCHED THEN
			INSERT (
				[DefinitionId],
				[Name], 
				[Name2], 
				[Name3],
				[Code],
				[CurrencyId],
				[CenterId],
				[Description],
				[Description2],
				[Description3],
				[Location], -- 4326 = World Geodetic System, used by Google Maps
				[LocationJson],
				[FromDate],
				[ToDate],
				[Decimal1],
				[Decimal2],
				[Int1],
				[Int2],
				[Lookup1Id],
				[Lookup2Id],
				[Lookup3Id],
				[Lookup4Id],
				[Text1],					
				[Text2],

				[AgentId],
				[TaxIdentificationNumber],
				[JobId],
				[BankAccountNumber]
				)
			VALUES (
				s.[DefinitionId],
				s.[Name], 
				s.[Name2], 
				s.[Name3],
				s.[Code],
				s.[CurrencyId],
				s.[CenterId],
				s.[Description],
				s.[Description2],
				s.[Description3],
				s.[Location], -- 4326 = World Geodetic System, used by Google Maps
				s.[LocationJson],
				s.[FromDate],
				s.[ToDate],
				s.[Decimal1],
				s.[Decimal2],
				s.[Int1],
				s.[Int2],
				s.[Lookup1Id],
				s.[Lookup2Id],
				s.[Lookup3Id],
				s.[Lookup4Id],
				s.[Text1],					
				s.[Text2],

				s.[AgentId],
				s.[TaxIdentificationNumber],
				s.[JobId],
				s.[BankAccountNumber]
				)
		OUTPUT s.[Index], inserted.[Id]
	) AS x;

	WITH AU AS (
		SELECT * FROM dbo.[RelationUsers] RU
		WHERE RU.[RelationId] IN (SELECT [Id] FROM @IndexedIds)
	)
	MERGE INTO AU AS t
	USING (
		SELECT
			RU.[Id],
			I.[Id] AS [RelationId],
			RU.[UserId]
		FROM @RelationUsers RU
		JOIN @IndexedIds I ON RU.[HeaderIndex] = I.[Index]
	) AS s ON (t.Id = s.Id)
	WHEN MATCHED AND (t.[UserId] <> s.[UserId])
	THEN
		UPDATE SET
			t.[UserId]					= s.[UserId],
			t.[ModifiedAt]				= @Now,
			t.[ModifiedById]			= @UserId
	WHEN NOT MATCHED THEN
		INSERT (
			[RelationId],
			[UserId]
		) VALUES (
			s.[RelationId],
			s.[UserId]
		)
	WHEN NOT MATCHED BY SOURCE THEN
		DELETE;

	-- indices appearing in IndexedImageList will cause the imageId to be update, if different.
	UPDATE A
	SET A.ImageId = L.ImageId
	FROM dbo.[Relations] A
	JOIN @IndexedIds II ON A.Id = II.[Id]
	JOIN @ImageIds L ON II.[Index] = L.[Index]

	IF @ReturnIds = 1
	SELECT * FROM @IndexedIds;
END