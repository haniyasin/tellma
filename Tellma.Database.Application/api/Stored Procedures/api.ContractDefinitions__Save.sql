﻿CREATE PROCEDURE [api].[ContractDefinitions__Save]
	@Entities [ContractDefinitionList] READONLY,
	@ReturnIds BIT = 0,
	@ValidationErrorsJson NVARCHAR(MAX) OUTPUT
AS
BEGIN
SET NOCOUNT ON;
	-- Add here Code that is handled by C#

	EXEC [bll].[ContractDefinitions_Validate__Save]
		@Entities = @Entities,
		@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

	IF @ValidationErrorsJson IS NOT NULL
		RETURN;

	EXEC [dal].[ContractDefinitions__Save]
		@Entities = @Entities,
		@ReturnIds = @ReturnIds;
END