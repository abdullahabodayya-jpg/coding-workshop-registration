
<?php

require_once __DIR__ . "/../repositories/WorkshopRepository.php";

class WorkshopController
{
    private WorkshopRepository $repository;

    public function __construct(WorkshopRepository $repository)
    {
        $this->repository = $repository;
    }

    
    public function index(): array
    {
        return $this->repository->getPublishedWorkshops();
    }

    public function show(string $id): array|false
    {
        return $this->repository->getPublishedWorkshopById($id);
    }
}
?>
