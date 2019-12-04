﻿CREATE PROCEDURE [dal].[Resources__Activate]
	@Ids [dbo].[IdList] READONLY,
	@IsActive bit
AS
	DECLARE @Now DATETIMEOFFSET(7) = SYSDATETIMEOFFSET();
	DECLARE @UserId INT = CONVERT(INT, SESSION_CONTEXT(N'UserId'));

	MERGE INTO [dbo].[Resources] AS t
	USING (
		SELECT [Id]
		FROM @Ids
	) AS s ON (t.Id = s.Id)
	WHEN MATCHED AND (t.IsActive <> @IsActive)
	THEN
		UPDATE SET 
			t.[IsActive]		= @IsActive,
			t.[ModifiedAt]		= @Now,
			t.[ModifiedById]	= @UserId;

	MERGE INTO [dbo].[Currencies] AS t
	USING (
		SELECT [CurrencyId] AS [Id] FROM dbo.Resources
		WHERE DefinitionId = N'currencies'
		AND [ResourceClassificationId] = dbo.fn_RCCode__Id(N'Cash')
		AND [Id] IN (SELECT [Id] FROM @Ids)
	) AS s ON (t.Id = s.Id)
	WHEN MATCHED AND (t.IsActive <> @IsActive)
	THEN
		UPDATE SET 
			t.[IsActive]		= @IsActive,
			t.[ModifiedAt]		= @Now,
			t.[ModifiedById]	= @UserId;