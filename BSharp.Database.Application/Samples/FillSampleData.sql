﻿	DECLARE @ValidationErrorsJson nvarchar(max);
	DECLARE @DebugRoles bit = 0, @DebugCurrencies bit = 0, @DebugMeasurementUnits bit = 0;
	DECLARE @DebugLookups bit = 0;
	DECLARE @DebugResources bit = 0, @DebugAgents bit = 0, @DebugAccountGroups bit = 0, @DebugAccountClassifications bit = 0, @DebugAccounts bit = 0;
	DECLARE @DebugResponsibilityCenters bit = 0;
	DECLARE @DebugManualVouchers bit = 0, @DebugReports bit = 0;
	DECLARE @DebugPettyCashVouchers bit = 1;
	DECLARE @LookupsSelect bit = 0;
	DECLARE @fromDate Date, @toDate Date;
	EXEC sp_set_session_context 'Debug', 1;
	DECLARE @UserId INT, @RowCount INT;

	SELECT @UserId = [Id] FROM dbo.[Users] WHERE [Email] = N'admin@bsharp.online';-- '$(DeployEmail)';
	EXEC sp_set_session_context 'UserId', @UserId;--, @read_only = 1;

	DECLARE @FunctionalCurrencyId NCHAR(3);
	SELECT @FunctionalCurrencyId = [FunctionalCurrencyId] FROM dbo.Settings;
	EXEC sp_set_session_context 'FunctionalCurrencyId', @FunctionalCurrencyId;--, @read_only = 1;

	DECLARE @Now DATETIMEOFFSET(7) = SYSDATETIMEOFFSET();
		:r .\00_Setup\a_RolesMemberships.sql
		:r .\00_Setup\b_AgentRelationDefinitions.sql
		:r .\00_Setup\c_ResourceTypes.sql

		:r .\01_Basic\d_Currencies.sql
		:r .\01_Basic\e_MeasurementUnits.sql
		:r .\01_Basic\g_Lookups.sql
		
		:r .\02_Agents\00_Agents.sql
		:r .\02_Agents\01_ResponsibilityCenters.sql
		:r .\02_Agents\02_Suppliers.sql
		:r .\02_Agents\03_Customers.sql
		:r .\02_Agents\04_Employees.sql

		:r .\03_Resources\a1_PPE_motor-vehicles.sql
		:r .\03_Resources\a2_PPE_it-equipment.sql
		:r .\03_Resources\a3_PPE_machineries.sql
		:r .\03_Resources\a4_PPE_general-fixed-assets.sql
		:r .\03_Resources\b_Inventories_raw-materials.sql
		:r .\03_Resources\d1_FG_vehicles.sql
		:r .\03_Resources\d2_FG_steel-products.sql
		:r .\03_Resources\e1_CCE_received-checks.sql
		:r .\03_Resources\h_PL_employee-benefits.sql

RETURN;
ERR_LABEL:
	SELECT * FROM OpenJson(@ValidationErrorsJson)
	WITH (
		[Key] NVARCHAR (255) '$.Key',
		[ErrorName] NVARCHAR (255) '$.ErrorName',
		[Argument0] NVARCHAR (255) '$.Argument0',
		[Argument1] NVARCHAR (255) '$.Argument1',
		[Argument2] NVARCHAR (255) '$.Argument2',
		[Argument3] NVARCHAR (255) '$.Argument3',
		[Argument4] NVARCHAR (255) '$.Argument4'
	);
	ROLLBACK;
RETURN;