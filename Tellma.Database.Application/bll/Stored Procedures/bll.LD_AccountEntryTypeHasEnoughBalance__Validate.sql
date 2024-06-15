﻿CREATE PROCEDURE [bll].[LD_AccountEntryTypeHasEnoughBalance__Validate]
	@DefinitionId INT,
	@LineDefinitionId INT,
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
DECLARE @Direction SMALLINT, @ParentAccountTypeConcept NVARCHAR (255);

SELECT
	@Direction = Direction,
	@ParentAccountTypeConcept = dal.fn_AccountType__Concept(ParentAccountTypeId)
FROM dbo.LineDefinitionEntries
WHERE LineDefinitionId = @LineDefinitionId
AND [Index] = @AccountEntryIndex

INSERT INTO @ErrorNames([ErrorIndex], [Language], [ErrorName]) VALUES
-- Errors corresponding to no balance, handled by first code snippet
(0, N'en',  N'The invoice has no dues to start with. Why pay this amount?'), 
(0, N'ar',  N'الفاتورة لا يوجد عليها مستحقات أصلا، فلماذا دفع هدا المبلغ'),

(1, N'en',  N'The employee has no dues to start with. Why pay this amount?'), 
(1, N'ar',  N'الموظف لا يوجد عليه مستحقات أصلا، فلماذا دفع هدا المبلغ'),

(2, N'en',  N'2:Fill the correct error message for VAT receivable in [bll].[LD_AccountHasEnoughBalance__Validate]'), 
(2, N'ar',  N'2:Fill the correct error message for VAT receivable in [bll].[LD_AccountHasEnoughBalance__Validate]'),

(3, N'en',  N'3:Fill the correct error message for Accrued Income in [bll].[LD_AccountHasEnoughBalance__Validate]'), 
(3, N'ar',  N'3:Fill the correct error message for Accrued Income in [bll].[LD_AccountHasEnoughBalance__Validate]'),

(4, N'en',  N'The employee has no installment balance for this loan type due on that date. Why defer this amount?'), 
(4, N'ar',  N'الموظف ليس عنده أقساط مستحقة بهذا التاريخ، فما معنى إعادة تقسيط هدا المبلغ؟'),

(5, N'en',  N'There is no balance on the selected sales invoice that justifies this payment'), 
(5, N'ar',  N'لا يوجد رصيد للفاتورة المذكورة يستدعي دفع هذا المبلغ'),

(6, N'en',  N'There is no balance on the receivable that justifies this payment'), 
(6, N'ar',  N'لا يوجد رصيد للدائن يستدعي دفع هذا المبلغ'),

(7, N'en',  N'This supplier account has no accrued expenses to start with. Why this invoice?'), 
(7, N'ar',  N'حساب هذا المورد لا يوجد عليه مصروفات مستحقة أصلا، فلماذاهذه الفاتورة'),

(9, N'en',  N'6:Fill the correct error message for Current Liabilities in [bll].[LD_AccountHasEnoughBalance__Validate]'), 
(9, N'ar',  N'6:Fill the correct error message for Current Liabilities in [bll].[LD_AccountHasEnoughBalance__Validate]'),

-- Errors corresponding to insufficient balance, handled by second code snippet
(10, N'en',  N'The remaining unsettled invoice amount is {0}, which is less than this amount'), 
(10, N'ar',  N'المبلغ المتبقي غير المدفوع من قيمةالفاتورة هو {0}، وهو أقل من هدا المبلغ'),

(11, N'en',  N'The remaining unsettled balance for that month is {0}, which is less than this amount'), 
(11, N'ar',  N'الرصيد المتبقي غير المدفوع من هذا الشهر هو {0}، وهو أقل من هدا المبلغ'),

(12, N'en',  N'12:Fill the correct error message for VAT receivable in [bll].[LD_AccountHasEnoughBalance__Validate]'), 
(12, N'ar',  N'12:Fill the correct error message for VAT receivable in [bll].[LD_AccountHasEnoughBalance__Validate]'),

(13, N'en',  N'13:Fill the correct error message for Accrued Income in [bll].[LD_AccountHasEnoughBalance__Validate]'), 
(13, N'ar',  N'13:Fill the correct error message for Accrued Income in [bll].[LD_AccountHasEnoughBalance__Validate]'),

(14, N'en',  N'The net installment balance for this loan type is {0}, which is less than this amount'), 
(14, N'ar',  N'القسط المستحق عن هذه السلفية هو {0}، وهو أقل من هدا المبلغ'),

(15, N'en',  N'Sales invoice balance is less than the amount paid'), 
(15, N'ar',  N'رصيد الفاتورة المتبقي أقل من المبلغ المدفوع'),

(16, N'en',  N'Receivable balance is less than the amount paid'), 
(16, N'ar',  N'الرصيد المتبقي أقل من المبلغ المدفوع'),

(17, N'en',  N'The supplier account accrued expenses are less than the invoiced amount'), 
(17, N'ar',  N'المصروفات المستجقة لهذا المورد أقل من قيمة الفاتورة'),

(19, N'en',  N'The remaining unsettled balance for that month is {0}, which is less than this amount'), 
(19, N'ar',   N'الرصيد المتبقي غير المدفوع من هذا الشهر هو {0}، وهو أقل من هدا المبلغ');

DECLARE @ErrorIndex INT = CASE
	WHEN @ParentAccountTypeConcept IN (
		N'CurrentPrepaidExpenses', N'CurrentAdvancesToSuppliers',
		N'CurrentTradeReceivables',  N'TradeAndOtherCurrentPayablesToTradeSuppliers',
		N'CurrentPrepayments'
	) THEN 0
	WHEN @ParentAccountTypeConcept = N'ShorttermEmployeeBenefitsAccruals' THEN 1 
	WHEN @ParentAccountTypeConcept = N'CurrentValueAddedTaxReceivables' THEN 2
	WHEN @ParentAccountTypeConcept = N'CurrentAccruedIncome' THEN 3
	WHEN @ParentAccountTypeConcept = N'CurrentFinancialAssetsAtAmortisedCost' THEN 4
	WHEN @ParentAccountTypeConcept IN (
		N'RentDeferredIncomeClassifiedAsCurrent',
		N'DeferredIncomeClassifiedAsCurrent'
	) THEN 5
	WHEN @ParentAccountTypeConcept = N'OtherCurrentReceivables' THEN 6
	WHEN @ParentAccountTypeConcept = N'AccrualsClassifiedAsCurrent' THEN 7
	WHEN @ParentAccountTypeConcept = N'CurrentLiabilities' THEN 9
	ELSE -1
END;
IF @ErrorIndex = -1 
	THROW 50000, N'bll.LD_AccountEntryTypeHasEnoughBalance__Validate:Could not find the parent account type', 1;

INSERT INTO @ValidationErrors([Key], [ErrorName])
SELECT DISTINCT TOP (@Top)
	'[' + CAST(D.[Index] AS NVARCHAR (255)) + '].Lines[' + CAST(L.[Index]  AS NVARCHAR(255)) + '].Entries[' + CAST(@ErrorEntryIndex AS NVARCHAR (255)) + '].' + @ErrorFieldName,
	dal.fn_ErrorNames_Index___Localize(@ErrorNames, @ErrorIndex) AS ErrorMessage
FROM @Documents D
JOIN @Lines L ON L.[DocumentIndex] = D.[Index]
JOIN @Entries E ON E.[LineIndex] = L.[Index] AND E.[DocumentIndex] = L.[DocumentIndex]
WHERE E.[Index] = @AccountEntryIndex
AND
ISNULL([dal].[fn_Account_Center_Currency_Agent_Resource_NotedDate_Line__Balance](
		E.AccountId, E.CenterId, E.CurrencyId, E.AgentId, E.ResourceId, E.NotedDate, L.[Id]
	), 0) = 0;

WITH AccountPriorBalance AS (
	SELECT
		E.[AccountId], E.[CenterId], E.[CurrencyId], E.[AgentId], E.[ResourceId], E.[NotedDate], E.[EntryTypeId],
		[dal].[fn_Account_Center_Currency_Agent_Resource_NotedDate_EntryType_Line__Balance](
			E.AccountId, E.CenterId, E.CurrencyId, E.AgentId, E.ResourceId, E.NotedDate, E.[EntryTypeId], L.[Id]
		) AS PriorBalance,
	SUM([Direction] * [MonetaryValue]) AS Amount
	FROM @Documents D
	JOIN @Lines L ON L.[DocumentIndex] = D.[Index]
	JOIN @Entries E ON E.[LineIndex] = L.[Index] AND E.[DocumentIndex] = L.[DocumentIndex]
	WHERE E.[Index] = @AccountEntryIndex
	GROUP BY L.[Id], E.[AccountId], E.[CenterId], E.[CurrencyId], E.[AgentId], E.[ResourceId], E.[NotedDate], E.[EntryTypeId]
)
INSERT INTO @ValidationErrors([Key], [ErrorName], [Argument0])
SELECT DISTINCT TOP (@Top)
	'[' + CAST(D.[Index] AS NVARCHAR (255)) + '].Lines[' + CAST(L.[Index]  AS NVARCHAR(255)) + '].Entries[' + CAST(@ErrorEntryIndex AS NVARCHAR (255)) + '].' + @ErrorFieldName,
	dal.fn_ErrorNames_Index___Localize(@ErrorNames, 10 + @ErrorIndex) AS ErrorMessage,
	ABS(AP.[PriorBalance])
FROM @Documents D
JOIN @Lines L ON L.[DocumentIndex] = D.[Index]
JOIN @Entries E ON E.[LineIndex] = L.[Index] AND E.DocumentIndex = L.DocumentIndex
JOIN AccountPriorBalance AP
	ON  (AP.[AccountId]	= E.[AccountId])
	AND (AP.[CenterId]	= E.[CenterId])
	AND (AP.[CurrencyId]= E.[CurrencyId])
	AND (AP.[AgentId]	= E.[AgentId])
	AND (AP.[ResourceId]= E.[ResourceId] OR AP.[ResourceId] IS NULL AND E.[ResourceId] IS NULL)
	AND (AP.[EntryTypeId]	= E.[EntryTypeId] OR AP.[EntryTypeId] IS NULL AND E.[EntryTypeId] IS NULL)
	AND (AP.[NotedDate]	<= E.[NotedDate] OR AP.[NotedDate] IS NULL AND E.[NotedDate] IS NULL)
WHERE E.[Index] = @AccountEntryIndex
AND AP.[PriorBalance] IS NOT NULL
AND SIGN(AP.[Amount] + AP.[PriorBalance]) = SIGN(@Direction)

IF EXISTS (SELECT * FROM @ValidationErrors)
	SELECT * FROM @ValidationErrors;
GO