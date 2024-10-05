﻿CREATE PROCEDURE [bll].[Documents_Validate__Assign]
	@Ids [dbo].[IndexedIdList] READONLY,
	@AssigneeId INT,
	@Comment NVARCHAR(1024),
	@Top INT = 200,
	@UserId INT,
	@IsError BIT OUTPUT
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @ValidationErrors [dbo].[ValidationErrorList];

	-- Must not assign a document that is already posted/canceled
	INSERT INTO @ValidationErrors([Key], [ErrorName], [Argument0])
	SELECT DISTINCT TOP (@Top)
		'[' + CAST(FE.[Index] AS NVARCHAR (255)) + ']',
		N'Error_CannotAssign0Documents',
		N'localize:Document_State_' + (CASE WHEN D.[State] = 1 THEN N'1' WHEN D.[State] = -1 THEN N'minus_1' END)
	FROM @Ids FE
	JOIN [dbo].[Documents] D ON FE.[Id] = D.[Id]
	WHERE D.[State] <> 0; -- Posted or Canceled

	-- Must not assign a document to the same assignee
	INSERT INTO @ValidationErrors([Key], [ErrorName], [Argument0])
	SELECT DISTINCT TOP (@Top)
		'[' + CAST(FE.[Index] AS NVARCHAR (255)) + ']',
		N'Error_TheDocumentIsAlreadyAssignedToUser0',
		[dbo].[fn_Localize](U.[Name], U.[Name2], U.[Name3]) As Assignee
	FROM @Ids FE
	JOIN [dbo].[DocumentAssignments] DA ON FE.[Id] = DA.[DocumentId]
	JOIN dbo.Users U ON DA.AssigneeId = U.[Id]
	WHERE DA.AssigneeId = @AssigneeId

-- Must not assign a document with no lines
	INSERT INTO @ValidationErrors([Key], [ErrorName])
	SELECT DISTINCT TOP (@Top)
		'[' + CAST(FE.[Index] AS NVARCHAR (255)) + ']',
		N'Error_TheDocumentHasNoLines'
	FROM @Ids FE
	WHERE NOT EXISTS (SELECT * FROM dbo.Lines WHERE [DocumentId] IN (SELECT [Id] FROM @Ids))
	AND NOT EXISTS(SELECT * FROM dbo.Attachments WHERE [DocumentId] IN (SELECT [Id] FROM @Ids))
			
	-- Set @IsError
	SET @IsError = CASE WHEN EXISTS(SELECT 1 FROM @ValidationErrors) THEN 1 ELSE 0 END;

	SELECT TOP (@Top) * FROM @ValidationErrors;
END;
