﻿DECLARE @Currencies CurrencyList;
INSERT INTO @Currencies([Index],
	[Id],	[Name],			[Name2],			[Description],			[Description2],		[E]) VALUES
(0, N'USD', N'USD',			N'دولار',			N'United States Dollar',N'دولار أمريكي',		2),
(1, N'ETB', N'Birr',		N'بر',				N'Ethiopian Birr',		N'بر أثيوبي',		2),
(2, N'GBP', N'Pounds',		N'جنيه',			N'Sterling Pound',		N'جنيه استرليني',	2),
(3, N'AED', N'Dirhams',		N'درهم',			N'Emirates Dirham',		N'درهم إماراتي',	2),
(4, N'SAR', N'Riyal',		N'ريال',				N'Saudi Riyal',			N'ريال سعودي',			2);
EXEC [api].Currencies__Save
	@Entities = @Currencies,
	@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

IF @ValidationErrorsJson IS NOT NULL 
BEGIN
	Print 'Currencies: Inserting'
	GOTO Err_Label;
END;						
EXEC master.sys.sp_set_session_context 'FunctionalCurrencyId', @FunctionalCurrencyId;

DECLARE @ActiveCurrencies IndexedStringList;
INSERT INTO @ActiveCurrencies([Index], [Id]) VALUES 
(0,N'GBP'),
(1,N'AED'),
(2,N'SAR');

EXEC api.Currencies__Activate
	@IndexedIds = @ActiveCurrencies,
	@IsActive = 0,
	@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

DECLARE @DeletedCurrencies IndexedStringList;
INSERT INTO @DeletedCurrencies
([Index],	[Id]) VALUES 
(0,			N'GBP'), 
(1,			N'SAR');

EXEC [api].Currencies__Delete
	@IndexedIds = @DeletedCurrencies,
	@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

DECLARE @R_ETB INT = (SELECT [Id] FROM dbo.Resources WHERE CurrencyId = N'ETB' AND ResourceClassificationId = dbo.fn_RCCode__Id(N'Cash') AND DefinitionId = N'currencies')
DECLARE @R_USD INT = (SELECT [Id] FROM dbo.Resources WHERE CurrencyId = N'USD' AND ResourceClassificationId = dbo.fn_RCCode__Id(N'Cash') AND DefinitionId = N'currencies')
	
IF @DebugCurrencies = 1
BEGIN
	SELECT * FROM map.Currencies();
	SELECT * FROM map.Resources();
END