﻿CREATE PROCEDURE [bll].[LD_EmployeeExpensesOnActiveCustomerAccount__Validate]
	@DefinitionId INT,
	@Documents [dbo].[DocumentList] READONLY,
	@DocumentLineDefinitionEntries [dbo].[DocumentLineDefinitionEntryList] READONLY,
	@Lines LineList READONLY,
	@Entries EntryList READONLY,
	@Top INT,
	@AccountEntryIndex INT,
	@ErrorEntryIndex INT,
	@ErrorFieldName NVARCHAR (255)
AS
DECLARE @ValidationErrors ValidationErrorList;
DECLARE @ErrorNames dbo.ErrorNameList;
SET NOCOUNT ON;
INSERT INTO @ErrorNames([ErrorIndex], [Language], [ErrorName]) VALUES
(0, N'en',  N'Cannot allocate employee expenses on expired project/customer account'),
(0, N'ar',  N'لا يصح تحميل مصروفات الموظف على مشروع/حساب عميل منته الصلاحية');

DECLARE @EmployeeBenefitsExpense HIERARCHYID = dal.fn_AccountTypeConcept__Node(N'EmployeeBenefitsExpense');

INSERT INTO @ValidationErrors([Key], [ErrorName])
SELECT DISTINCT TOP (@Top)
CASE 
WHEN FD.[AgentIsCommon] = 1 AND FD.[AgentId] IS NOT NULL THEN
	'[' + CAST(FD.[Index] AS NVARCHAR (255)) + '].' + @ErrorFieldName
WHEN DLDE.[AgentIsCommon] = 1 AND DLDE.[AgentId] IS NOT NULL THEN
	'[' + CAST(FD.[Index] AS NVARCHAR (255)) + '].LineDefinitionEntries[' + CAST(DLDE.[Index]  AS NVARCHAR(255)) + '].' + @ErrorFieldName
ELSE
	'[' + CAST(FD.[Index] AS NVARCHAR (255)) + '].Lines[' + CAST(FL.[Index]  AS NVARCHAR(255)) + '].Entries[' + CAST(@ErrorEntryIndex AS NVARCHAR (255)) + '].' + @ErrorFieldName
END,
dal.fn_ErrorNames_Index___Localize(@ErrorNames, 0) AS ErrorMessage
FROM @Documents FD
JOIN @Lines FL ON FL.[DocumentIndex] = FD.[Index]
JOIN @Entries FE ON FE.[LineIndex] = FL.[Index] AND FE.DocumentIndex = FL.DocumentIndex
LEFT JOIN @DocumentLineDefinitionEntries DLDE 
	ON DLDE.[DocumentIndex] = FL.[DocumentIndex] AND DLDE.[LineDefinitionId] = FL.[DefinitionId] AND DLDE.[EntryIndex] = FE.[Index]
JOIN dbo.Accounts A ON FE.[AccountId] =  A.[Id]
JOIN dbo.AccountTypes AC ON AC.[Id] = A.[AccountTypeId]
JOIN dbo.Agents AG ON AG.[Id] = FE.[AgentId]
JOIN dbo.AgentDefinitions AD ON AD.[Id] = AG.[DefinitionId]
WHERE AC.[Node].IsDescendantOf(@EmployeeBenefitsExpense) = 1
AND FE.[Index] = @AccountEntryIndex
AND AD.[Code] = N'TradeReceivableAccount'
AND AG.[Code] <> N'0'
AND FE.[Time2] > AG.[ToDate];

IF EXISTS(SELECT * FROM @ValidationErrors)
	SELECT * FROM @ValidationErrors;
GO